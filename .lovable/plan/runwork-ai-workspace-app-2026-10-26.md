# RunWork — AI workspace app

An all-white AI assistant for coding, writing, journaling, image generation and long "deep thinking", with built-in agents, a usage tracker, a live flip clock and sharing. No placeholder or dummy data anywhere: every list starts empty and fills from real use.

## Look and feel
- Pure white surfaces, soft grey cards, large rounded corners, subtle shadows, one warm orange accent (taken from the references) for active states and the send button.
- Layout inspired by the AiroGuide reference: left nav, middle thread list, main chat area with greeting and quick-start cards.
- Logo: the uploaded hatched "RW" sketch, used in the nav, the sign-in page and as the app icon.
- Distinctive type pairing (e.g. Sora + Manrope), no Inter/Poppins.

## Pages
1. **Sign in / Sign up** — email + password and Google. Guests can also use the app without an account (chats saved in this browser only).
2. **Home / Chat** (`/`, `/chat/:threadId`) — multiple threads, new-chat button, greeting with the user's name, quick-start cards (Code, Write, Journal, Image, Think deeply). Markdown and code blocks rendered; reasoning summary shown collapsibly when thinking.
3. **Agents** — built-in agents, starting with **Butler** (everyday tasks: accurate, smart, efficient). Choosing an agent starts a thread with it. Models stay hidden; users only see "Brain Zero" and agent names.
4. **Journal** — dated entries the user writes, with an "Ask RunWork to reflect" action.
5. **Images** — prompt-to-image generator with a gallery of the user's own generations.
6. **Usage** — styled like the "Home Analysis" / crypto-tracker references: messages, images and thinking sessions over time as bar charts, per-feature breakdown, all from real recorded activity.
7. **Connections** — share any chat, journal entry or image with friends via a public share link; list of things you've shared with revoke.
8. **Shared view** (`/s/:id`) — public read-only page a friend opens.

## Flip clock
A built-in animated flip clock (hours, minutes, seconds) showing the visitor's local time from their device's time zone, with the zone name (e.g. Asia/Manila). Shown in the chat header and full-size on the home screen.

## Models (hidden)
- **Brain Zero** (Gemini) — default chat model, with a "Think longer" toggle that raises reasoning effort.
- **Butler** — uses its own built-in system prompt and model under the hood.
- Image generation via the default image model.
- Model IDs never appear in the interface.

## Storage
- Signed in: threads, messages, journal entries, images, usage events and share links stored in Lovable Cloud, private per user.
- Guest: same features saved in this browser; prompted to sign in to sync and share.

## Technical details
- Enable Lovable Cloud; tables: profiles, threads, messages (UIMessage JSON), journal_entries, images (storage bucket), usage_events, shares (public read by token). RLS scoped to auth.uid(); shares readable by anon only via share token.
- AI via Lovable AI Gateway: streaming chat server route with AI SDK `streamText` + `useChat`; Brain Zero = `google/gemini-*` from live model listing; image route streaming the default image model. Usage events recorded server-side on each completion.
- AI Elements components for chat UI; recharts for usage.
- Each route gets its own head() metadata.
