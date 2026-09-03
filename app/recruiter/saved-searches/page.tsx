import { ChevronRight, Plus, Search } from "lucide-react";

const savedSearches = [
  {
    name: "Senior React talent",
    query: "React · TypeScript · 3+ years",
    count: 12,
    active: true,
  },
  {
    name: "Verified support leaders",
    query: "Customer handling · Gurgaon",
    count: 8,
    active: true,
  },
  {
    name: "Remote analysts",
    query: "SQL · Power BI · Remote",
    count: 5,
    active: false,
  },
];

export default function SavedSearches() {
  return (
    <main className="recruiter-page">
      <div className="recruiter-heading">
        <div>
          <span className="eyebrow">AUTOMATED DISCOVERY</span>
          <h1>Saved searches</h1>
          <p>Get a signal when new proof-qualified candidates appear.</p>
        </div>
        <button className="primary-button">
          <Plus size={16} /> Save a search
        </button>
      </div>

      <div className="saved-search-list">
        {savedSearches.map((search) => (
          <div className="saved-search-row" key={search.name}>
            <span className="saved-search-icon">
              <Search size={17} />
            </span>
            <div>
              <h2>{search.name}</h2>
              <p>{search.query}</p>
            </div>
            <span className="search-match">
              <b>{search.count}</b>
              <small>new matches</small>
            </span>
            <span className={`toggle ${search.active ? "on" : ""}`}>
              <i />
            </span>
            <ChevronRight size={17} />
          </div>
        ))}
      </div>
    </main>
  );
}
