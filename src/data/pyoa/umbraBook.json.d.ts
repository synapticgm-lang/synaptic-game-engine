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
      exits: Array<{
        id: string;
        label: string;
        to: string;
        setFlags?: Record<string, string | boolean>;
      }>;
    }>;
  };
  export default data;
}
