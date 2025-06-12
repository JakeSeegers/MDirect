// --- STATE ---
const state = {
  rawData: [],
  processedData: [],
  occupantData: [],
  isProcessing: false,
  errors: [],
  searchQuery: '',
  activeFilters: { building: '', floor: '', tags: [] },
  availableBuildings: [],
  availableFloors: [],
  availableTags: [],
  unmappedAbbreviations: {},
  customAbbreviationMappings: {},
  fuse: null,
  customTags: {}, // Stores rich tag objects: { roomId: [richTagObj1, richTagObj2] }
  staffTags: {},  // Stores staff names: { roomId: ["Staff: Name1", "Staff: Name2"] }
  autocompleteItems: [],
  autocompleteActiveIndex: -1,
  previouslyFocusedElement: null,
  charts: { floorChart: null, categoryChart: null }, // Example, if charts were used
  loadedFiles: [], // To track uploaded files {name, type, status, rows?, message?}
  buildingColors: {}, // { "BuildingName": "building-0", ... }
  currentPage: 1,
  resultsPerPage: 10, // Default, can be changed by user
  currentFilteredData: [], // Holds the data after all filters and search are applied
  hideSecurityReminder: false,
  uploadSectionOpen: true, // To control the collapsible upload section
  currentViewMode: 'desktop', // Default: 'desktop' or 'mobile'
  viewModeInitialized: false, // Track if initial view mode is set
};

// --- ELEMENTS ---
// This object will be populated in app.js on DOMContentLoaded
const elements = {};