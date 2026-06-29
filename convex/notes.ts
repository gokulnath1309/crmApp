import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";

export const list = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) {
      return [];
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    const notesWithCreator = [];
    for (const note of notes) {
      const creator = await ctx.db.get(note.createdBy);
      notesWithCreator.push({
        ...note,
        creatorName: creator?.name || "Unknown User",
        creatorAvatar: creator?.avatarUrl,
      });
    }

    return notesWithCreator.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    body: v.string(),
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }

    const noteId = await ctx.db.insert("notes", {
      body: args.body,
      entityType: args.entityType,
      entityId: args.entityId,
      createdBy: currentUser._id,
      createdAt: Date.now(),
    });

    return noteId;
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Note not found");

    // Insert version history
    await ctx.db.insert("noteVersions", {
      noteId: args.id,
      body: existing.body,
      updatedBy: existing.createdBy,
      updatedAt: existing.createdAt,
    });

    // Update note
    await ctx.db.patch(args.id, {
      body: args.body,
      createdAt: Date.now(),
      createdBy: currentUser._id,
    });

    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Note not found");

    // Clean up versions
    const versions = await ctx.db
      .query("noteVersions")
      .withIndex("by_noteId", (q) => q.eq("noteId", args.id))
      .collect();

    for (const ver of versions) {
      await ctx.db.delete(ver._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const listVersions = query({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) {
      return [];
    }

    const versions = await ctx.db
      .query("noteVersions")
      .withIndex("by_noteId", (q) => q.eq("noteId", args.noteId))
      .collect();

    const versionsWithCreator = [];
    for (const ver of versions) {
      const creator = await ctx.db.get(ver.updatedBy);
      versionsWithCreator.push({
        ...ver,
        creatorName: creator?.name || "Unknown User",
        creatorAvatar: creator?.avatarUrl,
      });
    }

    return versionsWithCreator.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
