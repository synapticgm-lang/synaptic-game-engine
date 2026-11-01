declare module '@/data/pyoa/umbraBook.json' {
  const data: {
    bibleId: string;
    startId: string;
    compiledAt?: string;
    nodeCount?: number;
    nodes: Array<{
      id: string;
      stake: string;
      endingId?: string | null;
      majorFork?: boolean;
      page?: string;
      variants?: Array<{
        when: Record<string, unknown>;
        replace?: string;
        before?: string;
        after?: string;
      }>;
      place?: string;
      exits: Array<{
        id: string;
        label: string;
        to: string;
        setFlags?: Record<string, string | boolean>;
        when?: Record<string, unknown>;
      }>;
    }>;
  };
  export default data;
}