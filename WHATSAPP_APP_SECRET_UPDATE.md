# WhatsApp App Secret Frontend Update

## Overview
Updated the frontend to support the new `appSecret` field in WhatsApp configuration for webhook signature verification.

## Changes Made

### 1. API Service (`src/services/api.ts`)
- Added `appSecret?: string` to the `whatsappApi.saveConfig` interface
- This allows the frontend to send the app secret to the backend

### 2. Settings Screen (`src/screens/SettingsScreen.tsx`)
- Added `appSecret` state variable
- Updated `fetchConfig()` to load app secret from backend response
- Updated all `whatsappApi.saveConfig()` calls to include `appSecret` parameter
- Passed `appSecret` and `setAppSecret` props to `MetaIntegrationView`

### 3. Meta Integration View (`src/screens/settings/MetaIntegrationView.tsx`)
- Added `appSecret` and `setAppSecret` to component props interface
- Added new TextInput field for App Secret with:
  - Label: "App Secret"
  - Placeholder: "Your Meta App Secret for webhook signature verification"
  - Secure text entry when not editing (hides the secret)
  - Only editable when in edit mode

## Security Features
- App Secret field is masked (`secureTextEntry`) when not in edit mode
- Field is only editable when user explicitly enters edit mode
- Proper validation and error handling maintained

## Backend Integration
- Frontend now sends `appSecret` in WhatsApp configuration requests
- Backend can store and retrieve app secret per tenant/user
- Enables proper webhook signature verification for security

## Usage
1. Navigate to Settings → Meta Configuration
2. Click "Edit Meta Config"
3. Enter your Meta App Secret in the new field
4. Save configuration
5. Webhook signature verification will now work properly

## Notes
- App Secret is optional during onboarding (can be configured later)
- Existing configurations will have empty app secret until manually updated
- This enables multi-tenant support where each tenant can have their own Meta App Secret