 export function  mapKeyValueToRecord(items: any[]): Record<string, string> {
    if (!Array.isArray(items)) return {};
    return items.reduce(
      (acc, item) => {
        if (item.key) acc[item.key] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }
