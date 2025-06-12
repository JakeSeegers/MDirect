// --- UI & ROW RENDERING ---

const StatsManager = {
    updateStats: async () => {
        // This function might be more complex if it involved fetching or heavy calculation.
        // For now, it's a placeholder if quick stats were displayed outside results count.
    },
    updateFilteredStats: (totalFilteredCount, currentDisplayCount) => {
        if (elements.resultsCount) {
            if (totalFilteredCount === 0) {
                elements.resultsCount.textContent = `Showing 0 rooms`;
            } else if (state.resultsPerPage === 0) { // Show all
                elements.resultsCount.textContent = `Showing all ${totalFilteredCount} rooms`;
            } else {
                const start = (state.currentPage - 1) * state.resultsPerPage + 1;
                const end = Math.min(start + state.resultsPerPage - 1, totalFilteredCount);
                elements.resultsCount.textContent = `Showing ${start}-${end} of ${totalFilteredCount} rooms`;
            }
        }
    },
};


function initializeAppView() {
  const storedViewMode = localStorage.getItem('hospitalDirectoryViewMode');
  if (storedViewMode) {
    state.currentViewMode = storedViewMode;
    state.viewModeInitialized = true; // Mark as initialized from storage
    if (elements.viewSelectionModal) elements.viewSelectionModal.classList.add('hidden');
    setViewMode(state.currentViewMode, false); // false: not from initial modal selection
  } else {
    if (elements.viewSelectionModal) elements.viewSelectionModal.classList.remove('hidden');
    // Default to desktop visually before selection, actual mode set on click
    document.body.classList.add('view-desktop');
  }
}

function setViewMode(mode, fromInitialModalSelection = false) {
  state.currentViewMode = mode;
  document.body.classList.remove('view-desktop', 'view-mobile');
  document.body.classList.add(mode === 'desktop' ? 'view-desktop' : 'view-mobile');

  if (elements.viewSwitchBtn) {
    if (mode === 'desktop') { // Current view is desktop, button offers switch to mobile
      elements.viewSwitchBtn.title = 'Switch to Mobile View';
      if(elements.viewSwitchIconMobilePhone) elements.viewSwitchIconMobilePhone.classList.remove('hidden');
      if(elements.viewSwitchIconDesktopMonitor) elements.viewSwitchIconDesktopMonitor.classList.add('hidden');
    } else { // Current view is mobile, button offers switch to desktop
      elements.viewSwitchBtn.title = 'Switch to Desktop View';
      if(elements.viewSwitchIconMobilePhone) elements.viewSwitchIconMobilePhone.classList.add('hidden');
      if(elements.viewSwitchIconDesktopMonitor) elements.viewSwitchIconDesktopMonitor.classList.remove('hidden');
    }
  }

  if (state.viewModeInitialized || fromInitialModalSelection) {
      localStorage.setItem('hospitalDirectoryViewMode', mode);
  }

  if (fromInitialModalSelection && elements.viewSelectionModal) {
    elements.viewSelectionModal.classList.add('hidden');
  }
  state.viewModeInitialized = true;

  updateResults(); // Re-render results for the new view
}

function toggleUploadSection() {
  state.uploadSectionOpen = !state.uploadSectionOpen;
  const content = elements.uploadContentSection;
  const chevron = elements.chevronIcon;

  if (content && chevron) {
    content.classList.toggle('expanded', state.uploadSectionOpen);
    content.classList.toggle('max-h-0', !state.uploadSectionOpen); // This class handles collapse
    chevron.classList.toggle('rotate-180', !state.uploadSectionOpen);
  }
}


function updateDataSummary() {
  if (!elements.dataSummary || !elements.summaryContent) return;

  if (state.processedData.length === 0) {
    elements.dataSummary.classList.add('hidden');
    return;
  }
  elements.dataSummary.classList.remove('hidden');

  const buildings = [...new Set(state.processedData.map(r => r.bld_descrshort || 'Unknown'))];
  const floors = [...new Set(state.processedData.map(r => r.floor))].sort((a, b) => Number(a) - Number(b)); // Ensure numeric sort

  elements.summaryContent.innerHTML = `
    <div class="bg-um-blue-light p-3 rounded-lg"><div class="font-medium text-um-blue">Buildings</div><div class="text-sm text-um-blue">${buildings.length} loaded</div></div>
    <div class="bg-um-maize-light p-3 rounded-lg border border-um-maize"><div class="font-medium text-um-text-on-maize">Floors</div><div class="text-sm text-um-text-on-maize">${floors.length} total</div></div>
    <div class="bg-gray-200 p-3 rounded-lg"><div class="font-medium text-gray-700">Rooms</div><div class="text-sm text-gray-700">${state.processedData.length} total</div></div>
  `;
}

function updateFilesListUI() {
    if (!elements.uploadedFilesList) return;
    elements.uploadedFilesList.innerHTML = '';
    if (state.loadedFiles.length > 0) {
        elements.uploadedFilesList.innerHTML = state.loadedFiles.map(f =>
            `<div class="flex justify-between items-center ${f.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'} px-2 py-1 rounded text-xs">
                <span>${sanitizeHTML(f.name)} (${f.type})</span>
                <span>${f.status === 'processed' ? (f.rows ? f.rows + ' rows' : 'Processed') : ('Error: ' + sanitizeHTML(f.message || 'Failed'))}</span>
            </div>`
        ).join('');
        elements.universalUploadArea.classList.add('has-files');
    } else {
        elements.universalUploadArea.classList.remove('has-files');
    }
}

function updateUploadAreaState() {
  const hasData = state.processedData.length > 0;
  if (elements.uploadContentNormal && elements.uploadContentEmpty) {
    elements.uploadContentNormal.classList.toggle('hidden', !hasData); // Show if hasData
    elements.uploadContentEmpty.classList.toggle('hidden', hasData);   // Show if !hasData
  }
}


function assignBuildingColor(building, index) {
    const colorClasses = ['building-0', 'building-1', 'building-2', 'building-3', 'building-4']; // Add more if needed
    return colorClasses[index % colorClasses.length];
}

function createRowElement(room) {
    const clone = elements.rowTemplate.content.cloneNode(true);
    const row = clone.querySelector('tr');
    row.dataset.roomId = room.id; // Store unique ID

    row.querySelector('[data-content="room-avatar"]').textContent = room.rmnbr.toString().slice(-2);
    row.querySelector('[data-content="rmnbr"]').textContent = room.rmnbr;

    const buildingIndicator = row.querySelector('[data-content="building-indicator"]');
    if (room.building && !state.buildingColors[room.building]) {
        state.buildingColors[room.building] = assignBuildingColor(room.building, Object.keys(state.buildingColors).length);
    }
    buildingIndicator.className = `building-indicator ${state.buildingColors[room.building] || 'building-0'}`; // Default color
    buildingIndicator.title = room.building || 'Unknown Building';


    row.querySelector('[data-content="floor"]').textContent = `F${room.floor} - ${room.building || 'Unknown'}`;
    row.querySelector('[data-content="typeFull"]').textContent = room.typeFull;
    row.querySelector('[data-content="dept_descr"]').textContent = room.dept_descr || '-';

    populateTagsContainer(row.querySelector('[data-container="tags"]'), room.tags);

    const combinedCustomStaffTags = [
      ...(state.staffTags[room.id] || []),
      ...(state.customTags[room.id] || [])
    ];
    populateTagsContainer(row.querySelector('[data-container="staff-custom-tags"]'), combinedCustomStaffTags);


    const mapLink = row.querySelector('[data-action="map-link"]');
    mapLink.href = room.mgisLink || '#';
    if (!room.mgisLink) mapLink.classList.add('hidden');

    row.querySelector('[data-action="add-tag"]').dataset.id = room.id;
    return row;
}

function createMobileCardElement(room) {
    const clone = elements.mobileCardTemplate.content.cloneNode(true);
    const card = clone.querySelector('.room-card');
    card.dataset.roomId = room.id;

    card.querySelector('[data-content="room-avatar"]').textContent = room.rmnbr.toString().slice(-2);
    card.querySelector('[data-content="rmnbr"]').textContent = room.rmnbr;

    const buildingIndicator = card.querySelector('[data-content="building-indicator"]');
    if (room.building && !state.buildingColors[room.building]) {
        state.buildingColors[room.building] = assignBuildingColor(room.building, Object.keys(state.buildingColors).length);
    }
    buildingIndicator.className = `building-indicator ${state.buildingColors[room.building] || 'building-0'}`;
    buildingIndicator.title = room.building || 'Unknown Building';

    card.querySelector('[data-content="floor-building"]').textContent = `F${room.floor} - ${room.building || 'Unknown'}`;
    card.querySelector('[data-content="typeFull"]').textContent = room.typeFull;
    card.querySelector('[data-content="dept_descr"]').textContent = room.dept_descr || '-';

    populateTagsContainer(card.querySelector('[data-container="tags"]'), room.tags);

    const combinedCustomStaffTags = [
        ...(state.staffTags[room.id] || []),
        ...(state.customTags[room.id] || [])
    ];
    populateTagsContainer(card.querySelector('[data-container="staff-custom-tags"]'), combinedCustomStaffTags);

    const mapLink = card.querySelector('[data-action="map-link"]');
    mapLink.href = room.mgisLink || '#';
    if (!room.mgisLink) mapLink.classList.add('hidden');

    card.querySelector('[data-action="add-tag"]').dataset.id = room.id;
    return card;
}


function populateTagsContainer(container, tags) {
    if (!container) return;
    container.innerHTML = '';
    if (!tags || tags.length === 0) return;

    tags.forEach(tagData => {
        const template = elements.tagSpanTemplate || document.getElementById('tag-span-template');
        if (!template) { console.error("tag-span-template not found"); return; }
        const clone = template.content.cloneNode(true);
        const span = clone.querySelector('span');

        span.className = 'tag-pill';

        if (typeof tagData === 'string') {
            if (tagData.startsWith('Staff: ')) {
                span.textContent = tagData.substring(7);
                span.classList.add('staff-tag-pill');
            } else {
                span.textContent = tagData;
                span.classList.add('default-tag');
            }
        } else if (typeof tagData === 'object' && tagData !== null && tagData.name) {
            span.textContent = tagData.name;
            span.classList.add(`tag-${tagData.color || 'blue'}`);

            if (tagData.isRich || tagData.description || tagData.link || tagData.imageUrl || tagData.contact) {
                span.classList.add('rich-tag');
                if (typeof displayTagInfo === 'function') { // displayTagInfo is global from app.js
                    span.onclick = () => displayTagInfo(tagData);
                }
            }
        } else {
            return;
        }
        container.appendChild(span);
    });
}

function updateFilterOptions() {
    if(elements.buildingFilter) {
        const currentBuilding = elements.buildingFilter.value;
        elements.buildingFilter.innerHTML = '<option value="">All Buildings</option>';
        state.availableBuildings.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b; opt.textContent = b;
            elements.buildingFilter.appendChild(opt);
        });
        elements.buildingFilter.value = currentBuilding;
    }
    if(elements.floorFilter) {
        const currentFloor = elements.floorFilter.value;
        elements.floorFilter.innerHTML = '<option value="">All Floors</option>';
        state.availableFloors.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f; opt.textContent = `Floor ${f}`;
            elements.floorFilter.appendChild(opt);
        });
        elements.floorFilter.value = currentFloor;
    }
    if(elements.tagFilter) {
        elements.tagFilter.innerHTML = '<option value="">Add Filter</option>';
        state.availableTags.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t; opt.textContent = t.replace(/-/g, ' ');
            elements.tagFilter.appendChild(opt);
        });
        elements.tagFilter.value = "";
    }

    if(elements.buildingFilterMobile) {
        elements.buildingFilterMobile.innerHTML = elements.buildingFilter.innerHTML;
        elements.buildingFilterMobile.value = elements.buildingFilter.value;
    }
    if(elements.floorFilterMobile) {
        elements.floorFilterMobile.innerHTML = elements.floorFilter.innerHTML;
        elements.floorFilterMobile.value = elements.floorFilter.value;
    }
    if(elements.tagFilterMobile) {
        elements.tagFilterMobile.innerHTML = elements.tagFilter.innerHTML;
        elements.tagFilterMobile.value = "";
    }
     if(elements.resultsPerPageMobile) {
        elements.resultsPerPageMobile.value = state.resultsPerPage.toString();
    }
    if(elements.resultsPerPage) {
        elements.resultsPerPage.value = state.resultsPerPage.toString();
    }
}

function updateActiveTagsDisplay() {
    if (!elements.activeTagsContainer || !elements.activeTagTemplate) return;

    elements.activeTagsContainer.classList.toggle('hidden', state.activeFilters.tags.length === 0);

    const existingTagPills = elements.activeTagsContainer.querySelectorAll('.active-tag-pill');
    existingTagPills.forEach(pill => pill.remove());

    const frag = document.createDocumentFragment();
    state.activeFilters.tags.forEach(tag => {
        const clone = elements.activeTagTemplate.content.cloneNode(true);
        clone.querySelector('[data-content="tag-name"]').textContent = tag.replace(/-/g, ' ');
        const removeButton = clone.querySelector('[data-action="remove-tag"]');
        removeButton.dataset.tag = tag;
        clone.querySelector('.active-tag-pill').dataset.tag = tag;
        frag.appendChild(clone);
    });

    if (elements.clearTagsBtn) {
        elements.activeTagsContainer.insertBefore(frag, elements.clearTagsBtn);
    } else {
        elements.activeTagsContainer.appendChild(frag);
    }
}


function updatePaginationControls(totalItems) {
    if (!elements.paginationControls || !elements.pageInfo || !elements.prevPageBtn || !elements.nextPageBtn) return;

    if (totalItems === 0 || state.resultsPerPage === 0) {
        elements.paginationControls.classList.add('hidden');
        return;
    }
    elements.paginationControls.classList.remove('hidden');

    const totalPages = Math.ceil(totalItems / state.resultsPerPage);
    elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;
}

async function updateUI() {
    if (state.processedData.length > 0) {
        elements.emptyState.classList.add('hidden');
        enableDependentFeatures();
        updateFilterOptions();
        await StatsManager.updateStats();
    } else {
        elements.emptyState.classList.remove('hidden');
    }

    if (state.viewModeInitialized) {
       await updateResults();
    }
    updateDataSummary();
    updateUploadAreaState();
}


async function updateResults() {
    const allFilteredData = data_getFilteredData(); // Uses function from data.js (assuming it's global)
    let dataToDisplay = [];

    const totalFilteredCount = state.currentFilteredData.length;

    if (state.resultsPerPage === 0) {
        dataToDisplay = [...state.currentFilteredData];
    } else {
        const startIndex = (state.currentPage - 1) * state.resultsPerPage;
        dataToDisplay = state.currentFilteredData.slice(startIndex, startIndex + state.resultsPerPage);
    }

    StatsManager.updateFilteredStats(totalFilteredCount, dataToDisplay.length);

    if (elements.resultsBody) {
        elements.resultsBody.innerHTML = '';
        if (dataToDisplay.length === 0 && totalFilteredCount > 0) {
             elements.resultsBody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-gray-500">No rooms on this page. Try another page or broaden your search.</td></tr>`;
        } else if (totalFilteredCount === 0) {
            elements.resultsBody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-gray-500">No rooms match your search.</td></tr>`;
        } else {
            const fragment = document.createDocumentFragment();
            dataToDisplay.forEach(r => fragment.appendChild(createRowElement(r)));
            window.requestAnimationFrame(() => {
                elements.resultsBody.appendChild(fragment);
            });
        }
    }

    if (elements.mobileResults) {
        elements.mobileResults.innerHTML = '';
        if (dataToDisplay.length === 0 && totalFilteredCount > 0) {
            elements.mobileResults.innerHTML = `<div class="text-center text-gray-500 py-12"><p>No rooms on this page. Try another page or broaden your search.</p></div>`;
        } else if (totalFilteredCount === 0) {
            elements.mobileResults.innerHTML = `<div class="text-center text-gray-500 py-12"><p>No rooms match your search.</p></div>`;
        } else {
            const fragment = document.createDocumentFragment();
            dataToDisplay.forEach(r => fragment.appendChild(createMobileCardElement(r)));
            elements.mobileResults.appendChild(fragment);
        }
    }


    if (elements.resultsFooter) {
        elements.resultsFooter.classList.toggle('hidden', state.processedData.length === 0);
    }
    updateActiveTagsDisplay();
    updatePaginationControls(totalFilteredCount);
}


function enableDependentFeatures() {
    if (elements.exportTagsBtn) elements.exportTagsBtn.disabled = false;
    if (elements.exportSessionBtn) elements.exportSessionBtn.disabled = false;

    if (elements.searchInput) elements.searchInput.disabled = false;
    if (elements.buildingFilter) elements.buildingFilter.disabled = false;
    if (elements.floorFilter) elements.floorFilter.disabled = false;
    if (elements.tagFilter) elements.tagFilter.disabled = false;
    if (elements.resultsPerPage) elements.resultsPerPage.disabled = false;

    if (elements.searchInputMobile) elements.searchInputMobile.disabled = false;
    if (elements.buildingFilterMobile) elements.buildingFilterMobile.disabled = false;
    if (elements.floorFilterMobile) elements.floorFilterMobile.disabled = false;
    if (elements.tagFilterMobile) elements.tagFilterMobile.disabled = false;
    if (elements.resultsPerPageMobile) elements.resultsPerPageMobile.disabled = false;
}