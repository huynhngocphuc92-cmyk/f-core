type Primitive = string | number;

export interface MessageDictionary {
  readonly [key: string]: string | MessageDictionary;
}

export type TranslateValues = Record<string, Primitive>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function getMessage(dictionary: MessageDictionary, key: string): string | undefined {
  const segments = key.split(".");
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }

  return typeof current === "string" ? current : undefined;
}

export function formatMessage(
  template: string,
  values?: TranslateValues
): string {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = values[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export function translateMessage(
  dictionary: MessageDictionary,
  key: string,
  fallback?: string,
  values?: TranslateValues
): string {
  const template = getMessage(dictionary, key) ?? fallback ?? key;
  return formatMessage(template, values);
}
