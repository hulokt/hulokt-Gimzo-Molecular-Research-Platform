import { Schema, model, models } from "mongoose";

// Message schema with editing and deletion support
const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text",
  },
  fileUrl: {
    type: String,
    default: "",
  },
  fileName: {
    type: String,
    default: "",
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Join request schema
const JoinRequestSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Invite request schema (for inviting users to group)
const InviteRequestSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Member schema with roles
const MemberSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["owner", "admin", "user"],
    default: "user",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const GroupSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  groupId: {
    type: String,
    unique: true,
    sparse: true, // Allows null/undefined values
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: {
    type: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "admin", "user"],
          default: "user",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
  messages: [MessageSchema],
  joinRequests: [JoinRequestSchema],
  inviteRequests: [InviteRequestSchema],
  isPublic: {
    type: Boolean,
    default: false,
  },
});

// Pre-save hook to generate groupId if not present
GroupSchema.pre("save", async function (next) {
  if (!this.groupId) {
    const min = 1000000000;
    const max = 999999999999999;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const newId = Math.floor(Math.random() * (max - min + 1) + min).toString();
      const existing = await Group.findOne({ groupId: newId });
      if (!existing) {
        this.groupId = newId;
        isUnique = true;
      }
      attempts++;
    }
  }
  next();
});

// In development, delete cached model to force schema recompilation
// This ensures schema changes are picked up
if (process.env.NODE_ENV === "development" && models?.Group) {
  delete models.Group;
}

const Group = models?.Group || model("Group", GroupSchema);

export default Group;
