"use client";

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () => import("@/components/crm/CommandPalette").then((module) => module.CommandPalette),
  { ssr: false }
);

export default function CommandPaletteClient() {
  return <CommandPalette />;
}
