/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as calendar from "../calendar.js";
import type * as companies from "../companies.js";
import type * as contacts from "../contacts.js";
import type * as customFields from "../customFields.js";
import type * as dashboard from "../dashboard.js";
import type * as deals from "../deals.js";
import type * as email from "../email.js";
import type * as emails from "../emails.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as lib_getCurrentUser from "../lib/getCurrentUser.js";
import type * as lib_notifications from "../lib/notifications.js";
import type * as lib_pipelineService from "../lib/pipelineService.js";
import type * as meetings from "../meetings.js";
import type * as migrations from "../migrations.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as passwordReset from "../passwordReset.js";
import type * as pipeline from "../pipeline.js";
import type * as rbac from "../rbac.js";
import type * as removeCompanyIdMigration from "../removeCompanyIdMigration.js";
import type * as search from "../search.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tasks from "../tasks.js";
import type * as teams from "../teams.js";
import type * as testCustomFields from "../testCustomFields.js";
import type * as testLeadDetails from "../testLeadDetails.js";
import type * as users from "../users.js";
import type * as workspaceInvitations from "../workspaceInvitations.js";
import type * as workspaceInvitationsTests from "../workspaceInvitationsTests.js";
import type * as workspaceInvitations_test from "../workspaceInvitations_test.js";
import type * as workspaceMembers from "../workspaceMembers.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  analytics: typeof analytics;
  auth: typeof auth;
  calendar: typeof calendar;
  companies: typeof companies;
  contacts: typeof contacts;
  customFields: typeof customFields;
  dashboard: typeof dashboard;
  deals: typeof deals;
  email: typeof email;
  emails: typeof emails;
  events: typeof events;
  http: typeof http;
  leads: typeof leads;
  "lib/getCurrentUser": typeof lib_getCurrentUser;
  "lib/notifications": typeof lib_notifications;
  "lib/pipelineService": typeof lib_pipelineService;
  meetings: typeof meetings;
  migrations: typeof migrations;
  notes: typeof notes;
  notifications: typeof notifications;
  passwordReset: typeof passwordReset;
  pipeline: typeof pipeline;
  rbac: typeof rbac;
  removeCompanyIdMigration: typeof removeCompanyIdMigration;
  search: typeof search;
  subscriptions: typeof subscriptions;
  tasks: typeof tasks;
  teams: typeof teams;
  testCustomFields: typeof testCustomFields;
  testLeadDetails: typeof testLeadDetails;
  users: typeof users;
  workspaceInvitations: typeof workspaceInvitations;
  workspaceInvitationsTests: typeof workspaceInvitationsTests;
  workspaceInvitations_test: typeof workspaceInvitations_test;
  workspaceMembers: typeof workspaceMembers;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
