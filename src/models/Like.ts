import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index to ensure unique likes per user per post
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const Like = mongoose.model<ILike>('Like', likeSchema);

export default Like;
