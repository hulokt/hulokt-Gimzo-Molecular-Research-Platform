"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useChannel, useAbly } from "ably/react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { 
  Send, 
  Plus, 
  Search, 
  Users, 
  X, 
  Check, 
  UserPlus, 
  LogIn,
  Bell,
  Trash2,
  Settings,
  Copy,
  Edit3,
  MoreVertical,
  Shield,
  ShieldCheck,
  Crown,
  Image as ImageIcon,
  Paperclip,
  Mail
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { resizeBase64Img } from "@/lib/utils";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  getGroupByGroupId,
  addMessageToGroup,
  getGroupMessages,
  searchUsers,
  inviteUserToGroup,
  getPendingInvites,
  handleInviteResponse,
  requestToJoinGroup,
  getPendingJoinRequests,
  handleJoinRequest,
  updateMemberRole,
  kickMember,
  leaveGroup,
  deleteGroup,
  updateGroupName,
  editMessage,
  deleteMessage,
} from "@/lib/actions/group.actions";
import { getUserByEmail } from "@/lib/actions/user.actions";
import { useSession } from "next-auth/react";
import Toast from "@/components/Toast/Toast";

function ChatBox() {
  const ably = useAbly();
  const { data: session } = useSession();
  const user = useUser();
  
  // Core state
  const [currentUser, setCurrentUser] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showMyInvites, setShowMyInvites] = useState(false);
  
  // Create group state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // Invite user state
  const [userSearchFirstName, setUserSearchFirstName] = useState("");
  const [userSearchLastName, setUserSearchLastName] = useState("");
  const [userSearchEmail, setUserSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [inviteMessage, setInviteMessage] = useState("");
  const [invitingUser, setInvitingUser] = useState(null);
  
  // Join group state
  const [groupSearchId, setGroupSearchId] = useState("");
  const [foundGroup, setFoundGroup] = useState(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  
  // Pending requests/invites state
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  
  // Edit state
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState("");
  
  // UI state
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  
  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const channelName = "gimzo-chat";
  const groupUpdatesChannelName = "gimzo-group-updates";
  const userUpdatesChannelName = "gimzo-user-updates";
  
  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };
  
  // Message channel
  const { channel } = useChannel(channelName, (message) => {
    if (currentGroup && message.data.groupId === currentGroup._id) {
      setMessages((prev) => [...prev, message.data]);
    }
  });

  // Group updates channel (for member changes, group updates, etc.) - manual subscription
  const groupUpdatesChannelRef = useRef(null);
  
  useEffect(() => {
    if (!ably) return;
    
    const channel = ably.channels.get(groupUpdatesChannelName);
    
    const handleMessage = async (message) => {
      const { event, data } = message.data;
      
      if (event === "group_updated") {
        // Refresh current group if it's the one that was updated
        if (currentGroup && data.groupId === currentGroup._id) {
          try {
            const updatedGroup = await getGroupById(data.groupId);
            setCurrentGroup(updatedGroup);
            setMyGroups(prev => prev.map(g => g._id === data.groupId ? updatedGroup : g));
          } catch (err) {
            console.error("Error refreshing group:", err);
          }
        } else {
          // Update in groups list
          try {
            const updatedGroup = await getGroupById(data.groupId);
            setMyGroups(prev => prev.map(g => g._id === data.groupId ? updatedGroup : g));
          } catch (err) {
            console.error("Error refreshing group in list:", err);
          }
        }
      } else if (event === "member_added" || event === "member_removed" || event === "member_role_changed") {
        // Refresh group when members change
        if (currentGroup && data.groupId === currentGroup._id) {
          try {
            const updatedGroup = await getGroupById(data.groupId);
            setCurrentGroup(updatedGroup);
            setMyGroups(prev => prev.map(g => g._id === data.groupId ? updatedGroup : g));
          } catch (err) {
            console.error("Error refreshing group after member change:", err);
          }
        } else {
          try {
            const updatedGroup = await getGroupById(data.groupId);
            setMyGroups(prev => prev.map(g => g._id === data.groupId ? updatedGroup : g));
          } catch (err) {
            console.error("Error refreshing group in list after member change:", err);
          }
        }
      } else if (event === "group_deleted") {
        // Remove group from list if deleted
        setMyGroups(prev => prev.filter(g => g._id !== data.groupId));
        if (currentGroup && currentGroup._id === data.groupId) {
          setCurrentGroup(null);
          setMessages([]);
        }
      } else if (event === "group_name_changed") {
        // Update group name
        if (currentGroup && data.groupId === currentGroup._id) {
          setCurrentGroup(prev => ({ ...prev, name: data.newName }));
        }
        setMyGroups(prev => prev.map(g => 
          g._id === data.groupId ? { ...g, name: data.newName } : g
        ));
      } else if (event === "join_request_received") {
        // Refresh pending join requests for group owners/admins
        if (currentUser) {
          try {
            const requests = await getPendingJoinRequests(currentUser._id);
            setPendingRequests(requests || []);
          } catch (err) {
            console.error("Error refreshing join requests:", err);
          }
        }
      }
    };
    
    channel.subscribe("update", handleMessage);
    groupUpdatesChannelRef.current = channel;
    
    return () => {
      channel.unsubscribe("update", handleMessage);
      groupUpdatesChannelRef.current = null;
    };
  }, [ably, currentGroup, currentUser]);

  // User updates channel (for invites, join requests) - manual subscription for dynamic user ID
  const userUpdatesChannelRef = useRef(null);
  
  useEffect(() => {
    if (!currentUser?._id || !ably) return;
    
    const channelName = `${userUpdatesChannelName}-${currentUser._id}`;
    const channel = ably.channels.get(channelName);
    
    const handleMessage = async (message) => {
      const { event, data } = message.data;
      
      if (event === "invite_received") {
        try {
          const invites = await getPendingInvites(currentUser._id);
          setPendingInvites(invites || []);
        } catch (err) {
          console.error("Error refreshing invites:", err);
        }
      } else if (event === "invite_accepted" || event === "invite_rejected") {
        if (event === "invite_accepted") {
          try {
            const userGroups = await getUserGroups(currentUser._id);
            setMyGroups(userGroups || []);
          } catch (err) {
            console.error("Error refreshing groups after invite acceptance:", err);
          }
        }
        try {
          const invites = await getPendingInvites(currentUser._id);
          setPendingInvites(invites || []);
        } catch (err) {
          console.error("Error refreshing invites:", err);
        }
      } else if (event === "join_request_received") {
        try {
          const requests = await getPendingJoinRequests(currentUser._id);
          setPendingRequests(requests || []);
        } catch (err) {
          console.error("Error refreshing join requests:", err);
        }
      } else if (event === "join_request_accepted" || event === "join_request_rejected") {
        if (event === "join_request_accepted") {
          try {
            const userGroups = await getUserGroups(currentUser._id);
            setMyGroups(userGroups || []);
          } catch (err) {
            console.error("Error refreshing groups after join request acceptance:", err);
          }
        }
        try {
          const requests = await getPendingJoinRequests(currentUser._id);
          setPendingRequests(requests || []);
        } catch (err) {
          console.error("Error refreshing join requests:", err);
        }
      }
    };
    
    channel.subscribe("update", handleMessage);
    userUpdatesChannelRef.current = channel;
    
    return () => {
      channel.unsubscribe("update", handleMessage);
      userUpdatesChannelRef.current = null;
    };
  }, [currentUser?._id, ably]);

  // Get user role in current group
  const getUserRole = useCallback(() => {
    if (!currentGroup || !currentUser) return null;
    const member = currentGroup.members.find(
      (m) => m.user._id === currentUser._id || m.user === currentUser._id
    );
    return member?.role || null;
  }, [currentGroup, currentUser]);

  const isOwner = getUserRole() === "owner";
  const isAdmin = getUserRole() === "admin" || isOwner;

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.email) return;
      
      try {
        setLoading(true);
        const userData = await getUserByEmail(session.user.email);
        setCurrentUser(userData);
        
        const userGroups = await getUserGroups(userData._id);
        setMyGroups(userGroups || []);
        
        const requests = await getPendingJoinRequests(userData._id);
        setPendingRequests(requests || []);
        
        const invites = await getPendingInvites(userData._id);
        setPendingInvites(invites || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [session?.user?.email]);

  // Search users for inviting
  const handleUserSearch = useCallback(async () => {
    if (!currentUser) return;
    if (!userSearchFirstName.trim() || !userSearchLastName.trim() || !userSearchEmail.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await searchUsers(
        userSearchFirstName.trim(),
        userSearchLastName.trim(),
        userSearchEmail.trim(),
        currentUser._id
      );
      setSearchResults(results || []);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
    }
  }, [currentUser, userSearchFirstName, userSearchLastName, userSearchEmail]);

  useEffect(() => {
    const timer = setTimeout(() => handleUserSearch(), 500);
    return () => clearTimeout(timer);
  }, [userSearchFirstName, userSearchLastName, userSearchEmail, handleUserSearch]);

  // Search group by ID
  const handleGroupSearch = useCallback(async () => {
    if (!groupSearchId.trim()) {
      setFoundGroup(null);
      return;
    }
    
    try {
      const group = await getGroupByGroupId(groupSearchId.trim());
      if (group) {
        // Check if user is already a member
        const isMember = group.members.some(
          (m) => m.user._id === currentUser?._id || m.user === currentUser?._id
        );
        if (isMember) {
          setFoundGroup(null);
          setError("You are already a member of this group");
        } else {
          setFoundGroup(group);
          setError("");
        }
      } else {
        setFoundGroup(null);
        setError("Group not found");
      }
    } catch (err) {
      setFoundGroup(null);
      setError("Group not found. Please check the ID.");
    }
  }, [currentUser, groupSearchId]);

  useEffect(() => {
    const timer = setTimeout(() => handleGroupSearch(), 500);
    return () => clearTimeout(timer);
  }, [groupSearchId, handleGroupSearch]);

  // Create group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentUser) return;
    
    setCreatingGroup(true);
    setError("");
    
    try {
      const newGroup = await createGroup(
        newGroupName.trim(),
        currentUser._id,
        newGroupDescription.trim()
      );
      
      // Publish real-time event
      if (groupUpdatesChannelRef.current) {
        await groupUpdatesChannelRef.current.publish("update", {
          event: "group_created",
          data: { groupId: newGroup._id }
        });
      }
      
      setMyGroups([newGroup, ...myGroups]);
      setCurrentGroup(newGroup);
      setMessages([]);
      
      if (newGroup.groupId) {
        navigator.clipboard.writeText(newGroup.groupId);
        showToast(`Group created! ID: ${newGroup.groupId} (copied)`, "success");
      } else {
        showToast("Group created!", "success");
      }
      
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDescription("");
    } catch (err) {
      setError(err.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  // Invite user
  const handleInviteUser = async (userId) => {
    if (!currentGroup || !currentUser) return;
    
    setInvitingUser(userId);
    try {
      await inviteUserToGroup(currentGroup._id, currentUser._id, userId, inviteMessage);
      
      // Publish real-time event to the invited user's channel
      const invitedUserChannel = ably.channels.get(`${userUpdatesChannelName}-${userId}`);
      await invitedUserChannel.publish("update", {
        event: "invite_received",
        data: { groupId: currentGroup._id, userId, invitedBy: currentUser._id }
      });
      
      showToast("Invite sent!", "success");
      setUserSearchFirstName("");
      setUserSearchLastName("");
      setUserSearchEmail("");
      setSearchResults([]);
      setInviteMessage("");
    } catch (err) {
      showToast(err.message || "Failed to send invite", "error");
    } finally {
      setInvitingUser(null);
    }
  };

  // Handle invite response
  const handleInvite = async (invite, action) => {
    try {
      if (action === "accept") {
        await handleInviteResponse(invite.groupId, invite.inviteId, currentUser._id, "accept");
        
        // Publish real-time events
        if (groupUpdatesChannelRef.current) {
          await groupUpdatesChannelRef.current.publish("update", {
            event: "member_added",
            data: { groupId: invite.groupId, userId: currentUser._id }
          });
        }
        if (userUpdatesChannelRef.current) {
          await userUpdatesChannelRef.current.publish("update", {
            event: "invite_accepted",
            data: { groupId: invite.groupId, userId: currentUser._id }
          });
        }
        
        showToast("You joined the group!", "success");
        const userGroups = await getUserGroups(currentUser._id);
        setMyGroups(userGroups || []);
      } else {
        await handleInviteResponse(invite.groupId, invite.inviteId, currentUser._id, "reject");
        
        // Publish real-time event
        if (userUpdatesChannelRef.current) {
          await userUpdatesChannelRef.current.publish("update", {
            event: "invite_rejected",
            data: { groupId: invite.groupId, userId: currentUser._id }
          });
        }
        
        showToast("Invite declined", "info");
      }
      setPendingInvites(pendingInvites.filter((i) => i.inviteId !== invite.inviteId));
    } catch (err) {
      showToast(err.message || "Failed to handle invite", "error");
    }
  };

  // Request to join
  const handleRequestJoin = async () => {
    if (!currentUser || !foundGroup) return;
    
    setJoiningGroup(true);
    try {
      await requestToJoinGroup(foundGroup._id, currentUser._id, joinMessage);
      
      // Publish real-time event - notify group owner and members
      if (groupUpdatesChannelRef.current) {
        await groupUpdatesChannelRef.current.publish("update", {
          event: "join_request_received",
          data: { groupId: foundGroup._id, userId: currentUser._id }
        });
      }
      
      // Also notify the user who sent the request
      if (userUpdatesChannelRef.current) {
        await userUpdatesChannelRef.current.publish("update", {
          event: "join_request_sent",
          data: { groupId: foundGroup._id }
        });
      }
      
      showToast(`Join request sent to ${foundGroup.name}`, "success");
      setGroupSearchId("");
      setFoundGroup(null);
      setJoinMessage("");
      setShowJoinGroup(false);
    } catch (err) {
      setError(err.message || "Failed to send join request");
    } finally {
      setJoiningGroup(false);
    }
  };

  // Handle join request
  const handleRequest = async (request, action) => {
    try {
      await handleJoinRequest(request.groupId, request.requestId, currentUser._id, action);
      
      // Publish real-time events
      if (action === "accept") {
        if (groupUpdatesChannelRef.current) {
          await groupUpdatesChannelRef.current.publish("update", {
            event: "member_added",
            data: { groupId: request.groupId, userId: request.user?._id || request.user }
          });
        }
        if (userUpdatesChannelRef.current) {
          await userUpdatesChannelRef.current.publish("update", {
            event: "join_request_accepted",
            data: { groupId: request.groupId, userId: request.user?._id || request.user }
          });
        }
      } else {
        if (userUpdatesChannelRef.current) {
          await userUpdatesChannelRef.current.publish("update", {
            event: "join_request_rejected",
            data: { groupId: request.groupId, userId: request.user?._id || request.user }
          });
        }
      }
      
      setPendingRequests(pendingRequests.filter((r) => r.requestId !== request.requestId));
      showToast(action === "accept" ? "User accepted" : "Request rejected", action === "accept" ? "success" : "info");
      
      if (action === "accept") {
        const userGroups = await getUserGroups(currentUser._id);
        setMyGroups(userGroups || []);
      }
    } catch (err) {
      showToast("Failed to handle request", "error");
    }
  };

  // Select group
  const handleSelectGroup = async (group) => {
    try {
      const fullGroup = await getGroupById(group._id);
      setCurrentGroup(fullGroup);
      
      const groupMessages = await getGroupMessages(group._id);
      const formattedMessages = groupMessages.map((msg) => ({
        ...msg,
        senderId: msg.sender._id,
        senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
        senderPhoto: msg.sender.photo || "/images/user/default-avatar.png",
      }));
      setMessages(formattedMessages);
    } catch (err) {
      console.error("Error loading group:", err);
      setMessages([]);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentGroup || !currentUser) return;
    
    try {
      const resizedImage = user?.photo 
        ? await resizeBase64Img(user.photo, 100, 100)
        : "/images/user/default-avatar.png";
      
      const messageData = {
        groupId: currentGroup._id,
        senderId: currentUser._id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        senderPhoto: resizedImage,
        text: messageText,
        messageType: "text",
        timestamp: new Date().toISOString(),
        connectionId: ably.connection.id,
      };
      
      await channel.publish("message", messageData);
      await addMessageToGroup(currentGroup._id, currentUser._id, messageText);
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
      showToast("Failed to send message", "error");
    }
  };

  // Edit message
  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;
    
    try {
      // Ensure we have the correct message ID format
      const messageId = editingMessage._id || editingMessage.id;
      if (!messageId) {
        showToast("Message ID not found", "error");
        return;
      }
      
      await editMessage(currentGroup._id, messageId.toString(), currentUser._id, editText);
      setMessages(messages.map((m) => {
        const mId = m._id || m.id;
        return mId === messageId ? { ...m, text: editText, isEdited: true } : m;
      }));
      setEditingMessage(null);
      setEditText("");
      showToast("Message edited", "success");
    } catch (err) {
      showToast(err.message || "Failed to edit message", "error");
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(currentGroup._id, messageId, currentUser._id);
      setMessages(messages.map((m) => 
        m._id === messageId ? { ...m, text: "This message was deleted", isDeleted: true } : m
      ));
      setMessageMenu(null);
      showToast("Message deleted", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete message", "error");
    }
  };

  // Update member role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const updatedGroup = await updateMemberRole(currentGroup._id, userId, newRole, currentUser._id);
      
      // Publish real-time event
      if (groupUpdatesChannelRef.current) {
        await groupUpdatesChannelRef.current.publish("update", {
          event: "member_role_changed",
          data: { groupId: currentGroup._id, userId, newRole }
        });
      }
      
      setCurrentGroup(updatedGroup);
      setMyGroups(myGroups.map((g) => g._id === updatedGroup._id ? updatedGroup : g));
      showToast(`Role updated to ${newRole}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update role", "error");
    }
  };

  // Kick member - show confirmation
  const handleKickMemberClick = (userId, userName) => {
    setConfirmAction("kick");
    setConfirmData({ userId, userName });
  };

  // Kick member - confirmed
  const handleKickMember = async () => {
    if (!confirmData) return;
    
    try {
      const updatedGroup = await kickMember(currentGroup._id, confirmData.userId, currentUser._id);
      
      // Publish real-time event
      if (groupUpdatesChannelRef.current) {
        await groupUpdatesChannelRef.current.publish("update", {
          event: "member_removed",
          data: { groupId: currentGroup._id, userId: confirmData.userId }
        });
      }
      
      setCurrentGroup(updatedGroup);
      setMyGroups(myGroups.map((g) => g._id === updatedGroup._id ? updatedGroup : g));
      showToast(`${confirmData.userName} has been removed from the group`, "success");
      setConfirmAction(null);
      setConfirmData(null);
    } catch (err) {
      showToast(err.message || "Failed to remove member", "error");
      setConfirmAction(null);
      setConfirmData(null);
    }
  };

  // Leave group - show confirmation
  const handleLeaveGroupClick = () => {
    setConfirmAction("leave");
    setConfirmData({ groupName: currentGroup?.name });
  };

  // Leave group - confirmed
  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(currentGroup._id, currentUser._id);
      setMyGroups(myGroups.filter((g) => g._id !== currentGroup._id));
      setCurrentGroup(null);
      setMessages([]);
      showToast("You left the group", "info");
      setConfirmAction(null);
      setConfirmData(null);
    } catch (err) {
      showToast(err.message || "Failed to leave group", "error");
      setConfirmAction(null);
      setConfirmData(null);
    }
  };

  // Delete group - show confirmation
  const handleDeleteGroupClick = () => {
    setConfirmAction("delete");
    setConfirmData({ groupName: currentGroup?.name });
  };

  // Delete group - confirmed
  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(currentGroup._id, currentUser._id);
      
      // Publish real-time event
      if (groupUpdatesChannelRef.current) {
        await groupUpdatesChannelRef.current.publish("update", {
          event: "group_deleted",
          data: { groupId: currentGroup._id }
        });
      }
      
      setMyGroups(myGroups.filter((g) => g._id !== currentGroup._id));
      setCurrentGroup(null);
      setMessages([]);
      showToast("Group deleted", "success");
      setConfirmAction(null);
      setConfirmData(null);
    } catch (err) {
      showToast(err.message || "Failed to delete group", "error");
      setConfirmAction(null);
      setConfirmData(null);
    }
  };

  // Rename group
  const handleRenameGroup = async () => {
    if (!newGroupNameInput.trim()) return;
    
    try {
      const updatedGroup = await updateGroupName(currentGroup._id, newGroupNameInput.trim(), currentUser._id);
      
      // Publish real-time event
      if (groupUpdatesChannelRef.current) {
        await groupUpdatesChannelRef.current.publish("update", {
          event: "group_name_changed",
          data: { groupId: currentGroup._id, newName: newGroupNameInput.trim() }
        });
      }
      
      setCurrentGroup(updatedGroup);
      setMyGroups(myGroups.map((g) => g._id === updatedGroup._id ? updatedGroup : g));
      setEditingGroupName(false);
      setNewGroupNameInput("");
      showToast("Group renamed", "success");
    } catch (err) {
      showToast(err.message || "Failed to rename group", "error");
    }
  };

  // Check if message can be edited/deleted (within 1 hour)
  const canModifyMessage = (message) => {
    if (!message.timestamp) return false;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(message.timestamp) > oneHourAgo;
  };

  // Get role icon
  const RoleIcon = ({ role }) => {
    if (role === "owner") return <Crown className="h-3 w-3 text-yellow-500" />;
    if (role === "admin") return <ShieldCheck className="h-3 w-3 text-blue-500" />;
    return null;
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      
      <div className="h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
              <div className="flex gap-2">
                {pendingInvites.length > 0 && (
                  <button
                    onClick={() => setShowMyInvites(true)}
                    className="relative rounded-lg p-2 text-green-500 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                    title="Pending invites"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                      {pendingInvites.length}
                    </span>
                  </button>
                )}
                {pendingRequests.length > 0 && (
                  <button
                    onClick={() => setShowPendingRequests(true)}
                    className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Join requests"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {pendingRequests.length}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setShowJoinGroup(true)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Join a group"
                >
                  <LogIn className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
                  title="Create new group"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="h-[calc(100%-65px)] overflow-y-auto p-2">
              {myGroups.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                  <Users className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500">No groups yet</p>
                  <p className="mt-1 text-xs text-gray-400">Create or join a group to start chatting</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {myGroups.map((group) => {
                    const myRole = group.members.find(
                      (m) => m.user._id === currentUser?._id || m.user === currentUser?._id
                    )?.role;
                    return (
                      <div
                        key={group._id}
                        onClick={() => handleSelectGroup(group)}
                        className={`w-full cursor-pointer rounded-lg p-3 text-left transition-colors ${
                          currentGroup?._id === group._id
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {group.name}
                              </span>
                              <RoleIcon role={myRole} />
                            </div>
                            <p className="text-xs text-gray-500">
                              {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-gray-400 truncate">
                                {group.groupId || "—"}
                              </span>
                              {group.groupId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(group.groupId);
                                    showToast("ID copied!", "success");
                                  }}
                                  className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-1 flex-col">
            {currentGroup ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex-1">
                    {editingGroupName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newGroupNameInput}
                          onChange={(e) => setNewGroupNameInput(e.target.value)}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                          placeholder="New name"
                        />
                        <button onClick={handleRenameGroup} className="text-green-500 hover:text-green-600">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setEditingGroupName(false); setNewGroupNameInput(""); }} className="text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{currentGroup.name}</h3>
                        {isOwner && (
                          <button
                            onClick={() => { setEditingGroupName(true); setNewGroupNameInput(currentGroup.name); }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {currentGroup.members.length} member{currentGroup.members.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">
                        ID: {currentGroup.groupId || "—"}
                      </span>
                      {currentGroup.groupId && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentGroup.groupId);
                            showToast("ID copied!", "success");
                          }}
                          className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => setShowInviteUser(true)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Invite user"
                      >
                        <UserPlus className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowGroupSettings(true)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Group settings"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Send className="mb-3 h-8 w-8 text-gray-300" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => {
                        const isMe = msg.senderId === currentUser?._id || msg.connectionId === ably.connection.id;
                        const canModify = isMe && canModifyMessage(msg) && !msg.isDeleted;
                        
                        return (
                          <div key={msg._id || index} className={`group flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                            <img
                              src={msg.senderPhoto || "/images/user/default-avatar.png"}
                              alt={msg.senderName}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div className={`relative max-w-[70%] ${isMe ? "text-right" : ""}`}>
                              <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                                <span>{msg.senderName}</span>
                                {msg.isEdited && <span className="italic">(edited)</span>}
                              </div>
                              <div
                                className={`inline-block rounded-2xl px-4 py-2 ${
                                  msg.isDeleted
                                    ? "bg-gray-100 italic text-gray-500 dark:bg-gray-700"
                                    : isMe
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                                }`}
                              >
                                {msg.text}
                              </div>
                              <div className="mt-1 text-[10px] text-gray-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              
                              {/* Message actions */}
                              {canModify && (
                                <div className={`absolute top-0 ${isMe ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"} hidden group-hover:flex items-center gap-1`}>
                                  <button
                                    onClick={() => { setEditingMessage(msg); setEditText(msg.text); }}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                                    title="Edit"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(msg._id)}
                                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {/* Edit Message Bar */}
                {editingMessage && (
                  <div className="border-t border-gray-200 bg-yellow-50 p-3 dark:border-gray-700 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">Editing message</span>
                      <button onClick={() => { setEditingMessage(null); setEditText(""); }} className="ml-auto text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                      />
                      <button
                        onClick={handleEditMessage}
                        className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Welcome to Messages</h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  Select a group or create a new one to start chatting
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Create Group
                  </button>
                  <button
                    onClick={() => setShowJoinGroup(true)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <LogIn className="h-4 w-4" /> Join Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Group</h3>
              <button onClick={() => { setShowCreateGroup(false); setError(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Protein Research Team"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What is this group about?"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowCreateGroup(false); setError(""); }}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || creatingGroup}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingGroup ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join a Group</h3>
              <button onClick={() => { setShowJoinGroup(false); setError(""); setFoundGroup(null); setGroupSearchId(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Enter Group ID</label>
                <p className="mb-2 text-xs text-gray-500">Ask the group owner for the ID</p>
                <input
                  type="text"
                  value={groupSearchId}
                  onChange={(e) => setGroupSearchId(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter group ID"
                  maxLength={15}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                />
              </div>

              {foundGroup && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{foundGroup.name}</h4>
                  <p className="mt-1 text-xs text-gray-500">{foundGroup.members.length} members</p>
                  <textarea
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Add a message (optional)"
                    rows={2}
                    className="mt-3 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                  />
                  <button
                    onClick={handleRequestJoin}
                    disabled={joiningGroup}
                    className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {joiningGroup ? "Sending..." : "Send Join Request"}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { setShowJoinGroup(false); setError(""); setFoundGroup(null); setGroupSearchId(""); }}
              className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteUser && currentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite User</h3>
              <button onClick={() => { setShowInviteUser(false); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-xs text-gray-500">Enter the exact first name, last name, and email to find a user</p>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={userSearchFirstName}
                onChange={(e) => setUserSearchFirstName(e.target.value)}
                placeholder="First Name"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
              />
              <input
                type="text"
                value={userSearchLastName}
                onChange={(e) => setUserSearchLastName(e.target.value)}
                placeholder="Last Name"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
              />
              <input
                type="email"
                value={userSearchEmail}
                onChange={(e) => setUserSearchEmail(e.target.value)}
                placeholder="Email"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((user) => (
                  <div key={user._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <img src={user.photo || "/images/user/default-avatar.png"} alt="" className="h-8 w-8 rounded-full" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInviteUser(user._id)}
                      disabled={invitingUser === user._id}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {invitingUser === user._id ? "..." : "Invite"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {userSearchFirstName && userSearchLastName && userSearchEmail && searchResults.length === 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                No user found matching all fields exactly
              </div>
            )}

            <button
              onClick={() => { setShowInviteUser(false); setSearchResults([]); setUserSearchFirstName(""); setUserSearchLastName(""); setUserSearchEmail(""); }}
              className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* My Invites Modal */}
      {showMyInvites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Group Invites ({pendingInvites.length})</h3>
              <button onClick={() => setShowMyInvites(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {pendingInvites.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending invites</p>
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {pendingInvites.map((invite) => (
                  <div key={invite.inviteId} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">{invite.groupName}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Invited by {invite.invitedBy?.firstName} {invite.invitedBy?.lastName}
                    </div>
                    {invite.message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">"{invite.message}"</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleInvite(invite, "accept")}
                        className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleInvite(invite, "reject")}
                        className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowMyInvites(false)}
              className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pending Requests Modal */}
      {showPendingRequests && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join Requests ({pendingRequests.length})</h3>
              <button onClick={() => setShowPendingRequests(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending requests</p>
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {pendingRequests.map((request) => (
                  <div key={request.requestId} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <img src={request.user?.photo || "/images/user/default-avatar.png"} alt="" className="h-10 w-10 rounded-full" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{request.user?.firstName} {request.user?.lastName}</div>
                        <div className="text-xs text-gray-500">{request.user?.email}</div>
                        <div className="text-xs text-gray-400">Wants to join {request.groupName}</div>
                      </div>
                    </div>
                    {request.message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">"{request.message}"</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleRequest(request, "accept")}
                        className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequest(request, "reject")}
                        className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowPendingRequests(false)}
              className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && currentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Group Settings</h3>
              <button onClick={() => setShowGroupSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Members */}
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Members ({currentGroup.members.length})</h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {currentGroup.members.map((member) => {
                  const memberUser = member.user;
                  const isCurrentUser = memberUser._id === currentUser?._id;
                  return (
                    <div key={memberUser._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <img src={memberUser.photo || "/images/user/default-avatar.png"} alt="" className="h-8 w-8 rounded-full" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {memberUser.firstName} {memberUser.lastName}
                              {isCurrentUser && " (you)"}
                            </span>
                            <RoleIcon role={member.role} />
                          </div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </div>
                      </div>
                      {isOwner && !isCurrentUser && member.role !== "owner" && (
                        <div className="flex gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(memberUser._id, e.target.value)}
                            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-white"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleKickMemberClick(memberUser._id, `${memberUser.firstName} ${memberUser.lastName}`)}
                            className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {isAdmin && !isOwner && !isCurrentUser && member.role === "user" && (
                        <button
                          onClick={() => handleKickMemberClick(memberUser._id, `${memberUser.firstName} ${memberUser.lastName}`)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              {isOwner ? (
                <button
                  onClick={handleDeleteGroupClick}
                  className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  Delete Group
                </button>
              ) : (
                <button
                  onClick={handleLeaveGroupClick}
                  className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  Leave Group
                </button>
              )}
            </div>

            <button
              onClick={() => setShowGroupSettings(false)}
              className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-[#1a1a1a]">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {confirmAction === "delete" && "Delete Group"}
              {confirmAction === "leave" && "Leave Group"}
              {confirmAction === "kick" && "Remove Member"}
            </h3>
            
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {confirmAction === "delete" && (
                <>Are you sure you want to delete <strong>"{confirmData?.groupName}"</strong>? This action cannot be undone and all messages will be permanently deleted.</>
              )}
              {confirmAction === "leave" && (
                <>Are you sure you want to leave <strong>"{confirmData?.groupName}"</strong>? You will need to be re-invited to rejoin.</>
              )}
              {confirmAction === "kick" && (
                <>Are you sure you want to remove <strong>"{confirmData?.userName}"</strong> from this group? They will need to be re-invited to rejoin.</>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setConfirmData(null);
                }}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction === "delete") handleDeleteGroup();
                  else if (confirmAction === "leave") handleLeaveGroup();
                  else if (confirmAction === "kick") handleKickMember();
                }}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {confirmAction === "delete" && "Delete Group"}
                {confirmAction === "leave" && "Leave Group"}
                {confirmAction === "kick" && "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}

export default ChatBox;
