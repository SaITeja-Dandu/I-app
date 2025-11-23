# Logging Guide

## Overview
Comprehensive logging has been added throughout the application to track user flows, state changes, and help with debugging. All logs are output to the browser console and categorized by module.

## Logging Modules

### SetupScreen (`src/pages/SetupScreen.tsx`)
**Module:** `setup-screen`

**Key Logs:**
- `SetupScreen mounted` - Component initialization with initialProfile status
- `User type selected: candidate` / `User type selected: interviewer` - User role selection
- `Returning to user type selection` - Back button on form
- `Role selected: {role}` - Professional role selection
- `Specialization toggled: {spec}` - Interviewer specializations
- `Skill added: {skill}` - Individual skill additions
- `Empty skill attempted`, `Duplicate skill attempted`, `Max skills reached` - Skill validation warnings
- `Resume scanner opened` / `Resume scanner closed` - Resume upload lifecycle
- `Resume analyzed` - Resume parsing completion with skill count
- `Skills updated from resume` - Auto-populated skills from resume
- `Form submission started` - Form submit initiated
- `Form validation completed` - Validation results with error count
- `Calling onProfileSave` - Before saving profile data
- `Profile saved successfully` - Successful profile persistence

### InterviewerDashboardScreen (`src/pages/InterviewerDashboardScreen.tsx`)
**Module:** `interviewer-dashboard`

**Key Logs:**
- `Fetching bookings` - Initial data load
- `Bookings updated: {count}` - Real-time booking updates
- `Back to lobby clicked` - Navigation action
- `Manage availability clicked` - Button navigation
- `View earnings clicked` - Button navigation
- `View analytics clicked` - Button navigation
- `Messages clicked` - Button navigation
- `Manage files clicked` - Button navigation
- `Switched to pending tab` / `Switched to upcoming tab` / `Switched to completed tab` - Tab navigation
- `Accept booking initiated: {bookingId}` - Booking acceptance start
- `Meeting link generated: {bookingId, meetingLink}` - Video meeting prep
- `Booking accepted successfully` - Successful booking update
- `Sending acceptance notification` - Notification dispatch
- `Failed to accept booking` - Error with message

### InterviewerAvailabilityScreen (`src/pages/InterviewerAvailabilityScreen.tsx`)
**Module:** `InterviewerAvailabilityScreen`

**Key Logs:**
- `Loading availability` - Fetch availability data
- `Loaded existing availability: {slotsCount}` - Data load completion
- `Day availability toggled: {day, isEnabled}` - Day enable/disable
- `Adding time slot: {day}` - New time slot creation
- `Removing time slot: {day, slotIndex}` - Slot deletion
- `Save schedule initiated` - Save action start
- `Cannot save - no userId` - Authentication check failure
- `Schedule validation failed` - Validation error
- `Converting schedule: {enabledDays, timezone}` - Data transformation
- `Saved weekly schedule: {daysCount, timezone}` - Successful save
- `Failed to save availability` - Error with message

## Log Levels

### `info` - High-level user actions
- Screen initialization
- User selections (type, role, specializations)
- Form submissions
- Navigation actions
- Data persistence
- Successful operations

### `debug` - Detailed state changes
- Tab switches
- Slot management (add, remove, toggle)
- Role selections
- Skill additions
- Timezone changes

### `warn` - Expected issues
- Validation failures
- Duplicate entries
- Max limits reached
- Missing authentication
- Empty input attempts

### `error` - Unexpected failures
- Save failures
- Booking acceptance errors
- Missing user data
- API errors

## Usage in Browser Console

### Filter by Module
Open DevTools (F12) → Console tab:

```javascript
// Show only setup screen logs
console.log('%cSetup', 'color: blue')

// Show only dashboard logs  
console.log('%cDashboard', 'color: green')
```

### Search for Specific Actions
```
// Search for all "clicked" events
Ctrl+F (in console) → search "clicked"

// Search for all errors
Ctrl+F → search "error"
```

### View Log Output Format
```
[module-name] {contextData} "Message"

Examples:
[setup-screen] {skill: 'React', totalSkills: 5} "Skill added"
[interviewer-dashboard] {bookingId: 'abc123'} "Accept booking initiated"
[InterviewerAvailabilityScreen] {day: 'Monday', isEnabled: true} "Day availability toggled"
```

## Debugging with Logs

### Signup Flow Troubleshooting
1. Open DevTools Console
2. Complete signup form
3. Look for:
   - `SetupScreen mounted` - Component loaded
   - `User type selected: interviewer` - Type selection confirmed
   - `Form submission started` - Form submitted
   - `Profile saved successfully` - Data persisted

### Navigation Issue Debugging
1. Open DevTools Console
2. Click dashboard button
3. Look for:
   - `{button-name} clicked` - Click registered
   - Screen should change if navigation working
   - If not, check browser cache (Ctrl+Shift+R hard refresh)

### Availability Setup Debugging
1. Open DevTools Console
2. Enable days and add time slots
3. Look for:
   - `Loading availability` - Initial load
   - `Day availability toggled` - Day enabled
   - `Adding time slot` - Slots added
   - `Saved weekly schedule` - Save successful

## Related Documentation
- `/GETTING_STARTED.md` - Project setup
- `/api/` - Firebase API documentation
- `src/utils/logger.ts` - Logger utility implementation
