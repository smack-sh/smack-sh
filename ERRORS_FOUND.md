# Errors Found in Smack Project

## Summary
This document lists all TypeScript errors and issues found in the project. The errors are categorized by severity and affected modules.

## Critical Errors (Related to Recent Changes)

### 1. Chat.client.tsx - Template Selection Issues (Lines 397-412)
**Location**: `app/components/chat/Chat.client.tsx`

- **Line 397**: `Argument of type 'ProviderInfo[]' is not assignable to parameter of type 'string'`
  - The `getTemplates()` function expects a string parameter, but is receiving `ProviderInfo[]`
  
- **Line 398**: `Property 'selectedTemplate' does not exist on type '{ template: string; title: string; }'`
  - Destructuring expects `selectedTemplate` but the return type only has `template`
  
- **Line 398**: `Property 'error' does not exist on type '{ template: string; title: string; }'`
  - Destructuring expects `error` but it's not in the return type
  
- **Line 400**: `Expected 1 arguments, but got 5`
  - `selectStarterTemplate()` is being called with 5 arguments but only expects 1
  
- **Line 412**: `'templates' is possibly 'null'`
  - Need to add null check before using `templates.find()`
  
- **Line 412**: `Property 'find' does not exist on type '{ assistantMessage: string; userMessage: string; }'`
  - The return type from `getTemplates` doesn't match expected array type

**Fix Required**: Check the actual signature of `getTemplates()` and `selectStarterTemplate()` functions and update the usage accordingly.

### 2. Chat.client.tsx - Error Handling Issue (Line 299)
**Location**: `app/components/chat/Chat.client.tsx:299`

- **Error**: `Object literal may only specify known properties, and 'retryable' does not exist in type 'LlmErrorAlertType'`
  
**Fix Required**: Remove or fix the `retryable` property in the error object or update the `LlmErrorAlertType` type definition.

###3. ChatBox.tsx - Type Issue (Line 247)
**Location**: `app/components/chat/ChatBox.tsx:247`

- **Error**: `Type 'false | Element' is not assignable to type 'string | Element'`
  
**Fix Required**: Ensure the value is either a string or Element, not a boolean.

## Existing Codebase Errors (Not Introduced by Changes)

### AI SDK / Message Type Issues
Multiple files are importing `Message` from 'ai' package, but it should be `UIMessage`:

- `app/components/chat/AssistantMessage.tsx:8`
- `app/components/chat/BaseChat.tsx:5`
- `app/components/chat/Chat.client.tsx:2`
- `app/components/chat/GitCloneButton.tsx:3`
- `app/components/chat/ImportFolderButton.tsx:2`
- `app/components/chat/Markdown.tsx:8`
- `app/components/chat/Messages.client.tsx:1`
- `app/components/chat/chatExportAndImport/ImportButtons.tsx:1`
- `app/components/git/GitUrlImport.client.tsx:2`
- `app/lib/.server/llm/create-summary.ts:1`
- `app/lib/.server/llm/select-context.ts:1`
- `app/lib/.server/llm/stream-text.ts:1`
- `app/lib/.server/llm/utils.ts:1`

**Fix Required**: Replace `import type { Message } from 'ai'` with `import type { Message as UIMessage } from 'ai'` or find the correct import.

### AI SDK / CoreTool Missing
- `app/lib/.server/llm/create-summary.ts:1`
- `app/lib/.server/llm/select-context.ts:1`

**Error**: `Module '"ai"' has no exported member 'CoreTool'`

### Vercel Integration Issues
**Location**: `app/components/@settings/tabs/vercel/VercelTab.tsx`

Multiple properties missing from `VercelUserResponse` type:
- `username` (lines 54, 244)
- `email` (lines 54, 245)  
- `id` (line 243)
- `name` (line 246)
- `avatar` (line 247)

**Location**: `app/components/@settings/tabs/vercel/components/VercelConnection.tsx`
- Property `user` does not exist on type `VercelUser` (lines 253, 261, 264)

### Provider/LLM Related Type Mismatches
- `app/lib/.server/llm/create-summary.ts` (lines 43, 49, 182)
- `app/lib/.server/llm/select-context.ts` (lines 51, 57, 171)
- `app/lib/.server/llm/stream-text.ts` (lines 108, 114, 277, 310)

**Error**: `Argument of type 'ProviderInfo' is not assignable to parameter of type 'BaseProvider'`
**Error**: `Property 'getModelInstance' does not exist on type 'ProviderInfo'`

### Missing Dependencies
- `app/config/database.ts:1` - Cannot find module 'pg'
- `app/lib/ai/code-generator.ts:2` - Cannot find module './desktop-generator'
- `app/lib/desktop-builder/ci-cd.ts:3` - Cannot find module '~/lib/ai/desktop-generator'

### Type Import Issues (verbatimModuleSyntax)
Multiple files have types that should be imported with `type` keyword:
- `app/components/desktop-builder/DesktopBuilderUI.tsx:8` - `BuildTarget`
- `app/components/desktop-builder/ProjectList.tsx:3` - `DesktopProject`
- `app/lib/ai/code-generator.ts:4` - `BuildTarget`
- `app/lib/desktop-builder/build.spec.ts:3` - `BuildTarget`
- `app/lib/desktop-builder/manager.ts:2` - `IDBPDatabase`
- `app/lib/desktop-builder/scaffold.ts:2` - `Template`
- `app/lib/desktop-builder/templates.spec.ts:3` - `Template`

### Test File Issues
**Location**: `app/lib/desktop-builder/*.spec.ts`
- Lines 41, 62, 71 in `scaffold.spec.ts`: `Cannot find namespace 'vi'`

### Stripe Integration Issue
**Location**: `app/components/credits/PurchaseCredits.tsx`
- Line 45: Property 'priceId' does not exist
- Line 49: Property 'sessionId' does not exist
- Line 51: Property 'redirectToCheckout' does not exist on type 'Stripe'

### Workbench Issues
- `app/components/workbench/FileTree.tsx:408` - Property 'renameFile' does not exist

### Auth/RBAC Issues
**Location**: `app/features/auth/RBAC.server.tsx`
- Lines 74-75: Type issues with `Params` and `AppLoadContext`

### Theme Manager Issues
**Location**: `app/features/themes/ThemeManager.tsx`
- Lines 129, 145: String not assignable to Theme type

### Team Dashboard Issue
**Location**: `app/features/team/TeamDashboard.tsx:43`
- Cannot find name 'userId'

### Other Type Issues
- `app/components/desktop-preview/DesktopPreview.tsx:43` - Invisible property type mismatch
- `app/components/roadmap/FeatureRoadmap.tsx:19,24` - Feature type issues
- `app/lib/desktop-builder/templates.ts:96` - Cannot find name 'type'
- `app/lib/fetch.ts:24` - Body type incompatibility with node-fetch

## Recommendations

### Immediate Actions Required (For Recent Changes)
1. Fix the `getTemplates()` and `selectStarterTemplate()` function calls in Chat.client.tsx
2. Remove or fix the `retryable` property error handling
3. Fix the ChatBox.tsx type issue on line 247

### Medium Priority (Existing Issues)
1. Update all AI SDK imports to use correct types (Message -> UIMessage, CoreTool issues)
2. Fix Vercel integration type definitions
3. Fix Provider/LLM type mismatches
4. Add missing dependencies or make them optional

### Low Priority
1. Fix test file issues (vitest imports)
2. Update type-only imports to use `import type` syntax
3. Fix miscellaneous type issues in features

## Notes
- Many of these errors appear to be pre-existing in the codebase
- The critical errors related to template selection are blocking the chat functionality
- Some errors may be due to API version mismatches (e.g., AI SDK updates)
- Consider adding strict type checking incrementally to avoid overwhelming the codebase
