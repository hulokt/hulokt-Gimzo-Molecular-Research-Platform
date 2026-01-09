"use server";
import mongoose from "mongoose";
import Group from "../database/models/group.model";
import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";

// Helper: Generate unique group ID
function generateGroupId(): string {
  const min = 1000000000;
  const max = 999999999999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

// Helper: Ensure group has ID
async function ensureGroupHasId(group: any) {
  if (!group.groupId) {
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const newId = generateGroupId();
      const existing = await Group.findOne({ groupId: newId });
      if (!existing) {
        group.groupId = newId;
        await group.save();
        isUnique = true;
      }
      attempts++;
    }
  }
  return group;
}

// Helper: Check user role in group
function getUserRole(group: any, userId: string): string | null {
  const member = group.members.find(
    (m: any) => m.user.toString() === userId || m.user._id?.toString() === userId
  );
  return member?.role || null;
}

// Helper: Check if user has permission
function hasPermission(role: string | null, requiredRole: "owner" | "admin" | "user"): boolean {
  if (!role) return false;
  if (requiredRole === "user") return true;
  if (requiredRole === "admin") return role === "owner" || role === "admin";
  if (requiredRole === "owner") return role === "owner";
  return false;
}

// Create a new group
export async function createGroup(
  groupName: string,
  creatorId: string,
  description: string = "",
) {
  try {
    await connectToDatabase();

    // Generate unique group ID
    let groupId: string = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      groupId = generateGroupId();
      const existing = await Group.findOne({ groupId });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) throw new Error("Failed to generate unique group ID");

    // Create group first
    const newGroup = new Group({
      groupId,
      name: groupName,
      description,
      createdBy: creatorId,
      isPublic: false,
    });

    // Add the creator as owner member - use string ID, Mongoose will cast it
    newGroup.members.push({
      user: creatorId,
      role: "owner",
      joinedAt: new Date(),
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(populatedGroup));
  } catch (error: any) {
    console.error("Error creating group:", error);
    throw new Error(error.message || "Failed to create group");
  }
}

// Get groups for a user
export async function getUserGroups(userId: string) {
  try {
    await connectToDatabase();

    const groups = await Group.find({ "members.user": userId })
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo")
      .sort({ createdAt: -1 });

    // Ensure all groups have IDs
    for (const group of groups) {
      await ensureGroupHasId(group);
    }

    const updatedGroups = await Group.find({ "members.user": userId })
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo")
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(updatedGroups));
  } catch (error) {
    console.error("Error retrieving user groups:", error);
    handleError(error);
  }
}

// Get group by MongoDB _id
export async function getGroupById(groupId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo")
      .populate("joinRequests.user", "firstName lastName email photo")
      .populate("inviteRequests.user", "firstName lastName email photo")
      .populate("inviteRequests.invitedBy", "firstName lastName email photo");

    if (!group) throw new Error("Group not found");
    await ensureGroupHasId(group);

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo")
      .populate("joinRequests.user", "firstName lastName email photo")
      .populate("inviteRequests.user", "firstName lastName email photo")
      .populate("inviteRequests.invitedBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error) {
    console.error("Error retrieving group:", error);
    handleError(error);
  }
}

// Get group by groupId string
export async function getGroupByGroupId(groupIdString: string) {
  try {
    await connectToDatabase();

    const group = await Group.findOne({ groupId: groupIdString })
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    if (!group) throw new Error("Group not found with this ID");

    return JSON.parse(JSON.stringify(group));
  } catch (error) {
    console.error("Error retrieving group by groupId:", error);
    handleError(error);
  }
}

// Update group name (owner only)
export async function updateGroupName(groupId: string, newName: string, requesterId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const role = getUserRole(group, requesterId);
    if (!hasPermission(role, "owner")) {
      throw new Error("Only the owner can rename the group");
    }

    group.name = newName;
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error: any) {
    console.error("Error updating group name:", error);
    throw new Error(error.message || "Failed to update group name");
  }
}

// Update group description (owner/admin)
export async function updateGroupDescription(groupId: string, newDescription: string, requesterId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const role = getUserRole(group, requesterId);
    if (!hasPermission(role, "admin")) {
      throw new Error("Only owners and admins can update the description");
    }

    group.description = newDescription;
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error: any) {
    console.error("Error updating group description:", error);
    throw new Error(error.message || "Failed to update description");
  }
}

// Invite a user to join the group
export async function inviteUserToGroup(
  groupId: string,
  inviterId: string,
  targetUserId: string,
  message: string = ""
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const role = getUserRole(group, inviterId);
    if (!hasPermission(role, "admin")) {
      throw new Error("Only owners and admins can invite users");
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (m: any) => m.user.toString() === targetUserId
    );
    if (isMember) throw new Error("User is already a member of this group");

    // Check if there's already a pending invite
    const existingInvite = group.inviteRequests.find(
      (r: any) => r.user.toString() === targetUserId && r.status === "pending"
    );
    if (existingInvite) throw new Error("User already has a pending invite");

    group.inviteRequests.push({
      user: new mongoose.Types.ObjectId(targetUserId),
      invitedBy: new mongoose.Types.ObjectId(inviterId),
      message,
      status: "pending",
    });

    await group.save();

    return JSON.parse(JSON.stringify(group));
  } catch (error: any) {
    console.error("Error inviting user:", error);
    throw new Error(error.message || "Failed to invite user");
  }
}

// Get pending invites for a user
export async function getPendingInvites(userId: string) {
  try {
    await connectToDatabase();

    const groups = await Group.find({
      "inviteRequests.user": userId,
      "inviteRequests.status": "pending",
    })
      .populate("createdBy", "firstName lastName email photo")
      .populate("inviteRequests.invitedBy", "firstName lastName email photo");

    const pendingInvites: any[] = [];
    groups.forEach((group) => {
      group.inviteRequests
        .filter((r: any) => r.user.toString() === userId && r.status === "pending")
        .forEach((invite: any) => {
          pendingInvites.push({
            inviteId: invite._id,
            groupId: group._id,
            groupName: group.name,
            groupIdString: group.groupId,
            invitedBy: invite.invitedBy,
            message: invite.message,
            createdAt: invite.createdAt,
          });
        });
    });

    return JSON.parse(JSON.stringify(pendingInvites));
  } catch (error) {
    console.error("Error getting pending invites:", error);
    handleError(error);
  }
}

// Handle invite response (accept/reject)
export async function handleInviteResponse(
  groupId: string,
  inviteId: string,
  userId: string,
  action: "accept" | "reject"
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const invite = group.inviteRequests.id(inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.user.toString() !== userId) throw new Error("This invite is not for you");

    if (action === "accept") {
      invite.status = "accepted";
      group.members.push({
        user: new mongoose.Types.ObjectId(userId),
        role: "user",
      });
    } else {
      invite.status = "rejected";
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error: any) {
    console.error("Error handling invite:", error);
    throw new Error(error.message || "Failed to handle invite");
  }
}

// Request to join a group
export async function requestToJoinGroup(
  groupId: string,
  userId: string,
  message: string = ""
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    // Check if already a member
    const isMember = group.members.some(
      (m: any) => m.user.toString() === userId
    );
    if (isMember) throw new Error("You are already a member of this group");

    // Check if already has a pending request
    const existingRequest = group.joinRequests.find(
      (r: any) => r.user.toString() === userId && r.status === "pending"
    );
    if (existingRequest) throw new Error("You already have a pending request");

    group.joinRequests.push({
      user: new mongoose.Types.ObjectId(userId),
      message,
      status: "pending",
    });
    await group.save();

    return JSON.parse(JSON.stringify(group));
  } catch (error: any) {
    console.error("Error requesting to join group:", error);
    throw new Error(error.message || "Failed to send join request");
  }
}

// Get pending join requests for groups owned/admin by user
export async function getPendingJoinRequests(userId: string) {
  try {
    await connectToDatabase();

    const groups = await Group.find({
      "members": {
        $elemMatch: {
          user: userId,
          role: { $in: ["owner", "admin"] }
        }
      },
      "joinRequests.status": "pending",
    })
      .populate("joinRequests.user", "firstName lastName email photo");

    const pendingRequests: any[] = [];
    groups.forEach((group) => {
      group.joinRequests
        .filter((r: any) => r.status === "pending")
        .forEach((request: any) => {
          pendingRequests.push({
            requestId: request._id,
            groupId: group._id,
            groupName: group.name,
            user: request.user,
            message: request.message,
            createdAt: request.createdAt,
          });
        });
    });

    return JSON.parse(JSON.stringify(pendingRequests));
  } catch (error) {
    console.error("Error getting pending requests:", error);
    handleError(error);
  }
}

// Handle join request (accept/reject)
export async function handleJoinRequest(
  groupId: string,
  requestId: string,
  handlerId: string,
  action: "accept" | "reject"
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const role = getUserRole(group, handlerId);
    if (!hasPermission(role, "admin")) {
      throw new Error("Only owners and admins can handle join requests");
    }

    const request = group.joinRequests.id(requestId);
    if (!request) throw new Error("Join request not found");

    if (action === "accept") {
      request.status = "accepted";
      group.members.push({
        user: request.user,
        role: "user",
      });
    } else {
      request.status = "rejected";
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error: any) {
    console.error("Error handling join request:", error);
    throw new Error(error.message || "Failed to handle request");
  }
}

// Update member role (owner only)
export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  newRole: "admin" | "user",
  requesterId: string
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const requesterRole = getUserRole(group, requesterId);
    if (!hasPermission(requesterRole, "owner")) {
      throw new Error("Only the owner can change member roles");
    }

    const member = group.members.find(
      (m: any) => m.user.toString() === targetUserId
    );
    if (!member) throw new Error("Member not found");
    if (member.role === "owner") throw new Error("Cannot change owner's role");

    member.role = newRole;
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error: any) {
    console.error("Error updating member role:", error);
    throw new Error(error.message || "Failed to update role");
  }
}

// Kick a member (owner or admin)
export async function kickMember(
  groupId: string,
  targetUserId: string,
  requesterId: string
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const requesterRole = getUserRole(group, requesterId);
    const targetRole = getUserRole(group, targetUserId);

    if (!hasPermission(requesterRole, "admin")) {
      throw new Error("You don't have permission to kick members");
    }

    if (targetRole === "owner") {
      throw new Error("Cannot kick the owner");
    }

    if (requesterRole === "admin" && targetRole === "admin") {
      throw new Error("Admins cannot kick other admins");
    }

    group.members = group.members.filter(
      (m: any) => m.user.toString() !== targetUserId
    );
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error: any) {
    console.error("Error kicking member:", error);
    throw new Error(error.message || "Failed to kick member");
  }
}

// Leave group (self)
export async function leaveGroup(groupId: string, userId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const role = getUserRole(group, userId);
    if (role === "owner") {
      throw new Error("Owner cannot leave the group. Transfer ownership or delete the group.");
    }

    group.members = group.members.filter(
      (m: any) => m.user.toString() !== userId
    );
    await group.save();

    return { success: true };
  } catch (error: any) {
    console.error("Error leaving group:", error);
    throw new Error(error.message || "Failed to leave group");
  }
}

// Delete group (owner only)
export async function deleteGroup(groupId: string, ownerId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const role = getUserRole(group, ownerId);
    if (!hasPermission(role, "owner")) {
      throw new Error("Only the owner can delete the group");
    }

    await Group.findByIdAndDelete(groupId);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting group:", error);
    throw new Error(error.message || "Failed to delete group");
  }
}

// Add a message
export async function addMessageToGroup(
  groupId: string,
  userId: string,
  text: string,
  messageType: "text" | "image" | "file" = "text",
  fileUrl: string = "",
  fileName: string = "",
  fileSize: number = 0
) {
  try {
    await connectToDatabase();
    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const isMember = group.members.some(
      (m: any) => m.user.toString() === userId
    );
    if (!isMember) throw new Error("You are not a member of this group");

    const message = {
      sender: new mongoose.Types.ObjectId(userId),
      text,
      messageType,
      fileUrl,
      fileName,
      fileSize,
    };

    group.messages.push(message);
    await group.save();

    const lastMessage = group.messages[group.messages.length - 1];
    return JSON.parse(JSON.stringify(lastMessage));
  } catch (error: any) {
    console.error("Error adding message:", error);
    throw new Error(error.message || "Failed to send message");
  }
}

// Get group messages
export async function getGroupMessages(groupId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId).populate(
      "messages.sender",
      "firstName lastName photo email",
    );
    if (!group) throw new Error("Group not found");

    // Filter out deleted messages (show placeholder) and return
    const messages = group.messages.map((msg: any) => ({
      ...msg.toObject(),
      text: msg.isDeleted ? "This message was deleted" : msg.text,
    }));

    return JSON.parse(JSON.stringify(messages));
  } catch (error) {
    console.error("Error retrieving group messages:", error);
    handleError(error);
  }
}

// Edit a message (within 1 hour)
export async function editMessage(
  groupId: string,
  messageId: string,
  userId: string,
  newText: string
) {
  try {
    await connectToDatabase();

    if (!groupId || !messageId || !userId) {
      throw new Error("Missing required parameters");
    }

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    // Convert messageId to string for comparison
    const messageIdStr = messageId.toString();
    
    // Try to find message by ID - handle both ObjectId and string formats
    let message = group.messages.id(messageIdStr);
    
    // If not found by .id(), try finding by _id string comparison
    if (!message) {
      message = group.messages.find((msg: any) => {
        if (!msg._id) return false;
        const msgId = msg._id.toString();
        return msgId === messageIdStr;
      });
    }
    
    if (!message) {
      console.error(`Message not found. GroupId: ${groupId}, MessageId: ${messageIdStr}`);
      throw new Error("Message not found");
    }
    
    if (message.sender.toString() !== userId) {
      throw new Error("You can only edit your own messages");
    }
    if (message.isDeleted) throw new Error("Cannot edit deleted message");

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (message.timestamp < oneHourAgo) {
      throw new Error("You can only edit messages within 1 hour");
    }

    message.text = newText;
    message.isEdited = true;
    message.editedAt = new Date();
    await group.save();

    return JSON.parse(JSON.stringify(message));
  } catch (error: any) {
    console.error("Error editing message:", error);
    throw new Error(error.message || "Failed to edit message");
  }
}

// Delete a message (within 1 hour for users, anytime for admins)
export async function deleteMessage(
  groupId: string,
  messageId: string,
  userId: string
) {
  try {
    await connectToDatabase();

    if (!groupId || !messageId || !userId) {
      throw new Error("Missing required parameters");
    }

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    // Convert messageId to string for comparison
    const messageIdStr = messageId.toString();
    
    // Try to find message by ID - handle both ObjectId and string formats
    let message = group.messages.id(messageIdStr);
    
    // If not found by .id(), try finding by _id string comparison
    if (!message) {
      message = group.messages.find((msg: any) => {
        if (!msg._id) return false;
        const msgId = msg._id.toString();
        return msgId === messageIdStr;
      });
    }
    
    if (!message) {
      console.error(`Message not found. GroupId: ${groupId}, MessageId: ${messageIdStr}, Total messages: ${group.messages.length}`);
      throw new Error("Message not found");
    }

    const role = getUserRole(group, userId);
    const isOwner = message.sender.toString() === userId;

    if (!isOwner && !hasPermission(role, "admin")) {
      throw new Error("You can only delete your own messages");
    }

    // Time check only for regular users
    if (isOwner && !hasPermission(role, "admin")) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (message.timestamp < oneHourAgo) {
        throw new Error("You can only delete messages within 1 hour");
      }
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await group.save();

    return JSON.parse(JSON.stringify(message));
  } catch (error: any) {
    console.error("Error deleting message:", error);
    throw new Error(error.message || "Failed to delete message");
  }
}

// Search users by name and email (exact match for all fields)
export async function searchUsers(
  firstName: string,
  lastName: string,
  email: string,
  currentUserId: string
) {
  try {
    await connectToDatabase();

    const query: any = { _id: { $ne: currentUserId } };

    if (firstName?.trim()) {
      query.firstName = { $regex: new RegExp(`^${firstName.trim()}$`, "i") };
    }
    if (lastName?.trim()) {
      query.lastName = { $regex: new RegExp(`^${lastName.trim()}$`, "i") };
    }
    if (email?.trim()) {
      query.email = { $regex: new RegExp(`^${email.trim()}$`, "i") };
    }

    if (!firstName && !lastName && !email) return [];

    const users = await User.find(query)
      .select("firstName lastName email photo")
      .limit(10);

    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    console.error("Error searching users:", error);
    handleError(error);
  }
}

// Search groups by groupId
export async function searchGroupsByGroupId(groupIdString: string) {
  try {
    await connectToDatabase();

    const group = await Group.findOne({ groupId: groupIdString })
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return group ? JSON.parse(JSON.stringify([group])) : [];
  } catch (error) {
    console.error("Error searching groups:", error);
    handleError(error);
  }
}

// Transfer ownership
export async function transferOwnership(
  groupId: string,
  currentOwnerId: string,
  newOwnerId: string
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const currentOwnerRole = getUserRole(group, currentOwnerId);
    if (currentOwnerRole !== "owner") {
      throw new Error("Only the current owner can transfer ownership");
    }

    const newOwnerMember = group.members.find(
      (m: any) => m.user.toString() === newOwnerId
    );
    if (!newOwnerMember) throw new Error("New owner must be a member of the group");

    // Update roles
    const currentOwnerMember = group.members.find(
      (m: any) => m.user.toString() === currentOwnerId
    );
    if (currentOwnerMember) currentOwnerMember.role = "admin";
    newOwnerMember.role = "owner";

    group.createdBy = new mongoose.Types.ObjectId(newOwnerId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo");

    return JSON.parse(JSON.stringify(updatedGroup));
  } catch (error: any) {
    console.error("Error transferring ownership:", error);
    throw new Error(error.message || "Failed to transfer ownership");
  }
}

// Get all groups (for admin purposes)
export async function getAllGroups() {
  try {
    await connectToDatabase();

    const groups = await Group.find()
      .populate("members.user", "firstName lastName email photo")
      .populate("createdBy", "firstName lastName email photo")
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(groups));
  } catch (error) {
    console.error("Error retrieving groups:", error);
    handleError(error);
  }
}
