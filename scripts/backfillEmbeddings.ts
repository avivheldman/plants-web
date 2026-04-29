import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../src/models/Post';
import { generateEmbedding } from '../src/services/aiService';

dotenv.config();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');

  const posts = await Post.find({ isPublished: true }).select('+embedding title content plantName tags');
  console.log(`Found ${posts.length} posts`);

  let ok = 0, skipped = 0, failed = 0;
  for (const post of posts) {
    if (Array.isArray(post.embedding) && post.embedding.length > 0) {
      console.log(`  skip: ${post.title.slice(0, 55)}`);
      skipped++;
      continue;
    }
    try {
      const text = [post.title, post.plantName, ...(post.tags ?? []), post.content]
        .filter(Boolean)
        .join(' ');
      const embedding = await generateEmbedding(text);
      await Post.updateOne({ _id: post._id }, { embedding });
      console.log(`  ✓ ${post.title.slice(0, 55)}`);
      ok++;
      await sleep(150);
    } catch (err) {
      console.warn(`  ✗ ${post.title.slice(0, 55)}: ${(err as Error).message}`);
      failed++;
      await sleep(1000);
    }
  }

  console.log(`\nDone — embedded: ${ok}, skipped: ${skipped}, failed: ${failed}`);
  await mongoose.disconnect();
};

run().catch(console.error);
