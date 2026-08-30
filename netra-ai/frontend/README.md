# Nexus Investigator

Build a desktop-first web application called "NEXUS" for the SIH26189 AI-Powered Criminal Network Analysis System.

IMPORTANT:

This is the FRONTEND prototype only. Do not build the real AI, backend, database, authentication, or external API integrations yet. Use completely fictional mock data throughout the application.

The purpose of the application is to help an authorized investigator explore relationships between entities from fictional investigation data such as case documents, call records, financial transactions, and locations.

DESIGN:

- Professional investigation/intelligence dashboard

- Modern, polished, serious visual design

- Dark theme

- Avoid excessive neon/cyberpunk styling

- Clean typography and excellent readability

- Desktop-first design optimized for a 1920x1080 monitor and projector

- Use a consistent design system

- Subtle animations and hover states

- Clear visual hierarchy

- The application should look like a serious government investigation tool rather than a generic admin dashboard

CREATE THESE MAIN SECTIONS:

1. LOGIN PAGE

- NEXUS logo/name

- "Investigation Intelligence Platform"

- Email field

- Password field

- Login button

- Since this is a prototype, login can use mock authentication

2. DASHBOARD

Show:

- Welcome/header section

- Active cases count

- Total entities count

- Total relationships count

- Recent activity

- Recent cases

- Quick action buttons

- Small network/activity visualization if appropriate

3. CASES PAGE

- List of fictional investigation cases

- Search cases

- Case status

- Date created

- Number of entities

- Number of relationships

- "Open Investigation" button

- "Create New Case" button

Create several fictional cases using fictional names and data.

4. CREATE CASE PAGE

Fields:

- Case name

- Case ID

- Description

- Date

- Priority

- Status

Add a Create Case button.

Use mock functionality for now.

5. UPLOAD DATA PAGE

Create three upload sections:

- FIR / Case Documents

- Call Detail Records (CDR)

- Financial Transaction Records

Each should have:

- Drag-and-drop area

- Choose file button

- Accepted file type indication

- Uploaded file display

- Remove file option

Add a prominent "Analyze Case" button.

For now, do not actually process files. Simulate the processing state and then show an analysis-complete state using mock data.

6. INVESTIGATION WORKSPACE

This is the MOST IMPORTANT PAGE.

Create a large interactive relationship-network visualization in the center.

The network should contain fictional entities such as:

- People

- Phone numbers

- Bank accounts

- Locations

- Organizations

Represent entities as nodes and relationships as edges.

Example relationships:

- CALLED

- TRANSFERRED MONEY TO

- LOCATED AT

- MENTIONED IN

- ASSOCIATED WITH

The graph should support:

- Zoom

- Pan

- Selecting a node

- Highlighting connected nodes

- Clear visual distinction between entity types

- Relationship labels where appropriate

Use a suitable React graph visualization library if available.

7. LEFT SIDEBAR ON INVESTIGATION PAGE

Include:

- Search entity

- Entity type filters

- Relationship type filters

- Date range filter

- Clear filters button

Entity types:

- Person

- Phone

- Bank Account

- Location

- Organization

Relationship types:

- Call

- Transaction

- Location

- Document mention

- Association

8. RIGHT-SIDE ENTITY DETAILS PANEL

When the user selects a node, show:

- Entity name

- Entity type

- ID

- Relevant fictional attributes

- Number of connections

- Direct connections

- Related cases

- Recent interactions

Include buttons such as:

- View Timeline

- Expand Connections

- View Supporting Records

9. TIMELINE PAGE/PANEL

Display fictional investigation events chronologically.

Example:

- Call between two entities

- Financial transaction

- Document mention

- Location event

Each event should show:

- Date/time

- Event type

- Entities involved

- Short description

- Supporting record reference

10. AI INSIGHTS PANEL

Create a section called "AI-Assisted Investigation Insights".

IMPORTANT:

These are only fictional demo insights. Do not claim that the system determines guilt or criminality.

Show example observations such as:

- "Multiple interactions were detected between selected entities."

- "A possible connection path exists between two selected entities."

- "Several interactions occurred within the selected time period."

- "The network contains a closely connected group of entities."

Every insight should have a "View Supporting Records" option.

11. SUPPORTING RECORDS

When selected, show fictional evidence records that explain why a relationship exists.

For example:

Relationship: Rahul Sharma → CALLED → Amit Kumar

Supporting record:

CDR-001

Date: 12 Aug 2026

Duration: 4 minutes

Use fictional information only.

12. NAVIGATION

Create a persistent sidebar navigation:

- Dashboard

- Cases

- Upload Data

- Investigation

- Timeline

- Settings

Include NEXUS branding at the top and a user profile section at the bottom.

13. MOCK DATA

Create a centralized mock-data structure so that the frontend can later replace it with real backend API responses.

Keep the data structure clean and documented.

For the network graph, use approximately:

- 12–20 fictional entities

- 20–30 fictional relationships

Make the network interesting enough to demonstrate indirect connections and clusters.

IMPORTANT ARCHITECTURE REQUIREMENT:

Keep the frontend components and data layer separated.

The frontend should be structured so that mock data can later be replaced with backend API calls without redesigning the UI.

Create reusable components for:

- Sidebar

- Header

- Case cards

- Stat cards

- Entity cards

- Filters

- Network graph

- Entity details panel

- Timeline events

- Upload components

- Modal/dialog components

Make all navigation work.

Make buttons and interactions functional with mock data wherever possible.

Do NOT add:

- Real criminal data

- Real personal information

- Real surveillance data

- Real financial information

- Claims that the system can determine whether someone is guilty

- Real law-enforcement integrations

The final result should feel like a polished SIH prototype that can later be connected to a backend, AI/NLP extraction pipeline, and Neo4j graph database.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c54a3eb3-cbec-4e6b-b00d-7e4d30ade5bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
