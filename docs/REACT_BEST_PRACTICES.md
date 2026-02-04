# React Best Practices for F-CORE
> Version: 1.0
> Stack: Next.js 16, React 19, TypeScript

---

## I. COMPONENT PATTERNS

### A. Server vs Client Components

```tsx
// SERVER COMPONENT (Default) - No "use client"
// Use for: Static content, data fetching, SEO
export default async function ContactsPage() {
  const contacts = await getContacts();
  return <ContactList contacts={contacts} />;
}

// CLIENT COMPONENT - Add "use client"
// Use for: Interactivity, hooks, browser APIs
"use client";
import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  // ...
}
```

### B. When to Use Client Components

- `useState`, `useEffect`, `useReducer`
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`localStorage`, `window`)
- Third-party libraries that use hooks

### C. Component Structure

```tsx
// 1. Imports
import { useState } from "react";
import type { Contact } from "@/types";

// 2. Types (if not in separate file)
interface Props {
  contact: Contact;
  onSave: (contact: Contact) => void;
}

// 3. Component
export default function ContactCard({ contact, onSave }: Props) {
  // 3a. Hooks
  const [isEditing, setIsEditing] = useState(false);

  // 3b. Handlers
  const handleSave = () => {
    onSave(contact);
    setIsEditing(false);
  };

  // 3c. Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

---

## II. STATE MANAGEMENT

### A. Local State (useState)

```tsx
// Simple state
const [isOpen, setIsOpen] = useState(false);

// Object state - use spread
const [form, setForm] = useState({ name: "", email: "" });
setForm((prev) => ({ ...prev, name: "John" }));

// Array state - use spread
const [items, setItems] = useState<string[]>([]);
setItems((prev) => [...prev, "new item"]);
```

### B. Complex State (useReducer)

```tsx
type State = { contacts: Contact[]; loading: boolean; error: string | null };
type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Contact[] }
  | { type: "FETCH_ERROR"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, contacts: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
```

### C. Server State (React Query / SWR)

```tsx
// Prefer server-side data fetching in Next.js
// Use client-side fetching only for real-time updates

// With fetch in Server Component
async function getContacts() {
  const res = await fetch("/api/contacts", { cache: "no-store" });
  return res.json();
}
```

---

## III. PERFORMANCE OPTIMIZATION

### A. Memoization

```tsx
// useMemo - Expensive calculations
const filteredContacts = useMemo(
  () => contacts.filter((c) => c.name.includes(search)),
  [contacts, search]
);

// useCallback - Stable function references
const handleClick = useCallback(() => {
  setCount((c) => c + 1);
}, []);

// memo - Prevent re-renders
const ContactCard = memo(function ContactCard({ contact }: Props) {
  return <div>{contact.name}</div>;
});
```

### B. When NOT to Memoize

- Simple calculations
- Primitive values
- Functions only used in render (not passed to children)

### C. Code Splitting

```tsx
// Dynamic imports for large components
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable SSR if needed
});
```

---

## IV. DATA FETCHING

### A. Server Components (Preferred)

```tsx
// app/contacts/page.tsx
export default async function ContactsPage() {
  // Fetch directly in component
  const contacts = await prisma.contact.findMany({
    where: { tenantId: "..." },
  });

  return <ContactList contacts={contacts} />;
}
```

### B. API Routes

```tsx
// app/api/contacts/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const contacts = await prisma.contact.findMany();
  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const contact = await prisma.contact.create({ data: body });
  return NextResponse.json(contact, { status: 201 });
}
```

### C. Server Actions (Form Submissions)

```tsx
// app/actions.ts
"use server";

export async function createContact(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await prisma.contact.create({
    data: { name, email, tenantId: "..." },
  });

  revalidatePath("/contacts");
}

// Usage in component
<form action={createContact}>
  <input name="name" />
  <button type="submit">Create</button>
</form>
```

---

## V. ERROR HANDLING

### A. Error Boundaries

```tsx
// app/contacts/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### B. Loading States

```tsx
// app/contacts/loading.tsx
export default function Loading() {
  return <div className="animate-pulse">Loading contacts...</div>;
}
```

### C. Not Found

```tsx
// app/contacts/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function ContactPage({ params }: { params: { id: string } }) {
  const contact = await getContact(params.id);

  if (!contact) {
    notFound();
  }

  return <ContactDetail contact={contact} />;
}
```

---

## VI. TYPESCRIPT PATTERNS

### A. Props Types

```tsx
// Inline types for simple components
function Button({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}

// Interface for complex components
interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactFormData) => Promise<void>;
  isLoading?: boolean;
}
```

### B. Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### C. Event Types

```tsx
// Form events
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// Input events
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// Click events
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};
```

---

## VII. HOOKS BEST PRACTICES

### A. Custom Hooks

```tsx
// hooks/useContacts.ts
export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch("/api/contacts")
      .then((res) => res.json())
      .then(setContacts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { contacts, loading, error };
}
```

### B. useEffect Cleanup

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", { signal: controller.signal })
    .then((res) => res.json())
    .then(setData);

  return () => controller.abort();
}, []);
```

### C. Avoid Common Mistakes

```tsx
// BAD: Object/array in dependency
useEffect(() => {
  // Runs every render!
}, [{ id: 1 }]);

// GOOD: Use primitive or memoized value
const contactId = contact.id;
useEffect(() => {
  // Runs when contactId changes
}, [contactId]);
```

---

## VIII. FILE ORGANIZATION

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   └── contacts/
│       ├── page.tsx       # /contacts
│       ├── [id]/
│       │   └── page.tsx   # /contacts/:id
│       ├── loading.tsx
│       └── error.tsx
├── components/
│   ├── ui/                # Generic UI (Button, Input, Card)
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
│       └── contacts/
│           ├── ContactList.tsx
│           ├── ContactCard.tsx
│           └── ContactForm.tsx
├── hooks/                 # Custom hooks
├── lib/                   # Utilities
├── types/                 # TypeScript types
└── styles/               # Global styles
```

---

## IX. ACCESSIBILITY

```tsx
// Always include alt text
<img src="..." alt="Contact avatar" />

// Use semantic HTML
<button>Click me</button>  // Not <div onClick={...}>

// ARIA labels for icons
<button aria-label="Close modal">
  <X className="w-5 h-5" />
</button>

// Focus management
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

---

## X. TESTING CHECKLIST

- [ ] Component renders without errors
- [ ] Props are typed correctly
- [ ] Loading states are handled
- [ ] Error states are handled
- [ ] Responsive on mobile/desktop
- [ ] Accessible (keyboard, screen reader)
- [ ] No console errors/warnings

---

*Tham chiếu file này khi viết bất kỳ React component nào.*
