/**
 * data.js
 * * This file contains functions for processing, searching, and managing room data.
 * It depends on a global `state` object which should contain:
 * - state.processedData: An array of room objects.
 * - state.customTags: An object mapping room IDs to an array of custom tags.
 * - state.staffTags: An object mapping room IDs to an array of staff/occupant tags.
 * * The fixes implemented address several critical search issues:
 * 1.  **Room Number Pattern Bug:** Prevents searches like "F4214" from being misidentified as floor searches.
 * 2.  **Strict Room Number Matching:** Adds fuzzy matching for room numbers with prefixes/suffixes (e.g., "F4214T").
 * 3.  **Restrictive Search Threshold:** Lowers the required term match percentage and prioritizes important terms.
 * 4.  **Missing Abbreviation Support:** Allows searching for full terms (e.g., "restroom") to find abbreviated room types (e.g., "PubRestRm").
 */

// --- STATE & HELPERS (Assumed to be defined elsewhere, included for context) ---

// Mock global state object for context. In the actual application, this would be managed centrally.
const state = {
    processedData: [],
    customTags: {},
    staffTags: {}
};

// A map to expand common abbreviations found in room data.
// This should be populated with mappings relevant to the source data.
const abbreviationMap = {
    'PubRestRm': 'Public Restroom',
    'Conf': 'Conference',
    'Mech': 'Mechanical',
    'Elec': 'Electrical',
    'Stor': 'Storage',
    'Off': 'Office',
    'Lab': 'Laboratory',
    'Clsrm': 'Classroom',
    'Lnge': 'Lounge',
    // Add other abbreviations as needed
};

/**
 * Converts ordinal words (first, second, etc.) to numbers.
 * @param {string} word The word to convert.
 * @returns {number|null} The corresponding number or null if not found.
 */
function convertWordToNumber(word) {
    const words = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    const index = words.indexOf(word.toLowerCase());
    return index !== -1 ? index + 1 : null;
}

/**
 * Gets the ordinal suffix for a number (st, nd, rd, th).
 * @param {number} i The number.
 * @returns {string} The ordinal suffix.
 */
function getOrdinalSuffix(i) {
    const j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) {
        return "st";
    }
    if (j === 2 && k !== 12) {
        return "nd";
    }
    if (j === 3 && k !== 13) {
        return "rd";
    }
    return "th";
}

/**
 * Converts a number to its word equivalent (for numbers 1-10).
 * @param {number} num The number to convert.
 * @returns {string|null} The word or null if out of range.
 */
function numberToWord(num) {
    const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    if (num >= 1 && num <= 10) {
        return words[num - 1];
    }
    return null;
}


// ==================== SEARCH & FILTERING FUNCTIONS ====================


/**
 * ENHANCED: Creates a comprehensive set of searchable tags for a room.
 * This version adds expanded tags for abbreviated room types and subtypes.
 * @param {object} room The room object from processedData.
 * @returns {string[]} A unique array of searchable tags.
 */
function createUnifiedTags(room) {
    const tags = [];

    // Building tags (enhanced with variations)
    if (room.building) {
        const building = room.building.toLowerCase();
        tags.push(building);
        tags.push(`building:${building}`);
        tags.push(`bldg:${building}`);
        // Add individual words from building name
        building.split(/[\s\-]+/).forEach(word => {
            if (word.length > 1) tags.push(word);
        });
    }
    if (room.bld_descrshort && room.bld_descrshort !== room.building) {
        const bldShort = room.bld_descrshort.toLowerCase();
        tags.push(bldShort);
        tags.push(`building:${bldShort}`);
        bldShort.split(/[\s\-]+/).forEach(word => {
            if (word.length > 1) tags.push(word);
        });
    }

    // Enhanced floor tags with natural language variations
    if (room.floor !== undefined && room.floor !== null) {
        const floor = room.floor.toString();

        // Basic floor tags
        tags.push(floor);
        tags.push(`floor:${floor}`);
        tags.push(`f${floor}`);
        tags.push(`level:${floor}`);

        // Natural language floor tags
        tags.push(`floor ${floor}`);
        tags.push(`level ${floor}`);
        tags.push(`${floor}${getOrdinalSuffix(parseInt(floor))} floor`);

        // Word-based floor tags for common floors
        const floorWord = numberToWord(parseInt(floor));
        if (floorWord) {
            tags.push(`${floorWord} floor`);
            tags.push(`${floorWord} level`);
        }
    }

    // Department tags (enhanced)
    if (room.dept_descr) {
        const dept = room.dept_descr.toLowerCase();
        tags.push(dept);
        tags.push(`department:${dept}`);
        tags.push(`dept:${dept}`);
        // Add individual words from department
        dept.split(/[\s\-\/]+/).forEach(word => {
            if (word.length > 2) tags.push(word);
        });
    }

    // ENHANCED: Room type tags with abbreviation expansion
    if (room.typeFull) {
        const type = room.typeFull.toLowerCase();
        tags.push(type);
        tags.push(`type:${type}`);
        tags.push(`room:${type}`);
        // Add individual words from room type
        type.split(/[\s\-\/]+/).forEach(word => {
            if (word.length > 2) tags.push(word);
        });
    }

    // NEW: Add abbreviated room type tags with expansions
    if (room.rmtyp_descrshort) {
        const abbrevType = room.rmtyp_descrshort.toLowerCase();
        tags.push(abbrevType);

        // Add expanded version if available
        const expandedType = abbreviationMap[room.rmtyp_descrshort];
        if (expandedType) {
            const expandedLower = expandedType.toLowerCase();
            tags.push(expandedLower);
            tags.push(`type:${expandedLower}`);

            // Add individual words from expanded type
            expandedLower.split(/[\s\-\/]+/).forEach(word => {
                if (word.length > 2) tags.push(word);
            });
        }
    }

    // NEW: Add abbreviated subtype tags with expansions
    if (room.rmsubtyp_descrshort) {
        const abbrevSubtype = room.rmsubtyp_descrshort.toLowerCase();
        tags.push(abbrevSubtype);

        // Add expanded version if available
        const expandedSubtype = abbreviationMap[room.rmsubtyp_descrshort];
        if (expandedSubtype) {
            const expandedLower = expandedSubtype.toLowerCase();
            tags.push(expandedLower);
            tags.push(`subtype:${expandedLower}`);

            // Add individual words from expanded subtype
            expandedLower.split(/[\s\-\/]+/).forEach(word => {
                if (word.length > 2) tags.push(word);
            });
        }
    }

    // System-generated category tags
    if (room.tags) {
        room.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            tags.push(tagLower);
            tags.push(`category:${tagLower}`);
            // Add individual words from tags
            tagLower.split(/[\s\-]+/).forEach(word => {
                if (word.length > 2) tags.push(word);
            });
        });
    }

    // Custom tags (enhanced)
    const customTags = state.customTags[room.id] || [];
    customTags.forEach(tagObj => {
        if (tagObj.name) {
            const name = tagObj.name.toLowerCase();
            tags.push(name);
            tags.push(`custom:${name}`);
            // Add individual words from custom tag names
            name.split(/\s+/).forEach(word => {
                if (word.length > 1) tags.push(word);
            });
        }
        if (tagObj.type) {
            tags.push(`tagtype:${tagObj.type.toLowerCase()}`);
        }
        if (tagObj.color) {
            tags.push(`color:${tagObj.color.toLowerCase()}`);
        }
    });

    // Enhanced staff tags
    const staffTags = state.staffTags[room.id] || [];
    staffTags.forEach(staffTag => {
        const name = staffTag.replace('Staff: ', '').toLowerCase();
        tags.push(name);
        tags.push(`staff:${name}`);
        tags.push(`person:${name}`);
        tags.push(`occupant:${name}`);
        // Add individual name parts
        name.split(/\s+/).forEach(namePart => {
            if (namePart.length > 1) tags.push(namePart);
        });
    });

    // Room number variations (enhanced)
    if (room.rmnbr) {
        const roomNum = room.rmnbr.toString().toLowerCase();
        tags.push(roomNum);
        tags.push(`room:${roomNum}`);
        tags.push(`number:${roomNum}`);

        // Add partial room number matches for longer room numbers
        if (roomNum.length > 2) {
            for (let i = 2; i <= roomNum.length; i++) {
                tags.push(roomNum.substring(0, i));
            }
        }

        // Add room number without common prefixes/suffixes
        const stripped = roomNum.replace(/^[a-z]+|[a-z]+$/g, '');
        if (stripped && stripped !== roomNum) {
            tags.push(stripped);
        }
    }

    return [...new Set(tags)]; // Remove duplicates
}

/**
 * FIXED: Pre-processes a search query into structured terms.
 * This version uses more specific regex for floor detection to avoid capturing
 * room numbers like "F4214" as floors.
 * @param {string} query The raw search query from the user.
 * @returns {object[]} An array of processed term objects.
 */
function preprocessSearchQuery(query) {
    if (!query || typeof query !== 'string') return [];

    const originalQuery = query.trim().toLowerCase();
    const processedTerms = [];

    // FIXED: More specific floor pattern detection
    const floorPatterns = [
        // "floor 3", "floor3", "floor-3" - but NOT "F4214"
        { regex: /(?:^|\s)floor[\s\-]?(\d+)(?:\s|$)/g, type: 'floor' },
        // "3rd floor", "2nd floor", "1st floor" 
        { regex: /(?:^|\s)(\d+)(?:st|nd|rd|th)?\s*floor(?:\s|$)/g, type: 'floor' },
        // "level 3", "level3", "lv 3", "lv3"
        { regex: /(?:^|\s)(?:level|lv)[\s\-]?(\d+)(?:\s|$)/g, type: 'floor' },
        // FIXED: Only match "f3", "f-3" but NOT "f4214" (must be short numbers)
        { regex: /(?:^|\s)f[\s\-]?(\d{1,2})(?:\s|$)/g, type: 'floor' },
        // Ordinal words: "third floor", "second level"
        { regex: /(?:^|\s)(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s*(?:floor|level)(?:\s|$)/g, type: 'floor_word' }
    ];

    // Building pattern detection
    const buildingPatterns = [
        { regex: /(?:^|\s)(?:building|bldg)[\s\-:]?\s*([a-zA-Z0-9\-\s]+?)(?:\s|$)/g, type: 'building' },
        { regex: /(?:^|\s)(?:in|at)\s+([a-zA-Z0-9\-\s]+?)(?:\s+(?:building|bldg)|$)/g, type: 'building' }
    ];

    // Department/type patterns
    const departmentPatterns = [
        { regex: /(?:^|\s)(?:dept|department)[\s\-:]?\s*([a-zA-Z0-9\-\s]+?)(?:\s|$)/g, type: 'department' },
        { regex: /(?:^|\s)(?:type|room\s*type)[\s\-:]?\s*([a-zA-Z0-9\-\s]+?)(?:\s|$)/g, type: 'room_type' }
    ];

    // Staff/occupant patterns
    const staffPatterns = [
        { regex: /(?:^|\s)(?:staff|person|occupant)[\s\-:]?\s*([a-zA-Z\s\-\.]+?)(?:\s|$)/g, type: 'staff' },
        { regex: /(?:^|\s)(?:dr|doctor|prof|professor)[\s\.]?\s*([a-zA-Z\s\-\.]+?)(?:\s|$)/g, type: 'staff' }
    ];

    let remainingQuery = originalQuery;

    // Process floor patterns first (highest priority)
    floorPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(originalQuery)) !== null) {
            if (pattern.type === 'floor_word') {
                const floorNumber = convertWordToNumber(match[1]);
                if (floorNumber !== null) {
                    processedTerms.push({
                        type: 'floor',
                        value: floorNumber.toString(),
                        original: match[0].trim(),
                        boost: 2.0
                    });
                }
            } else {
                processedTerms.push({
                    type: 'floor',
                    value: match[1],
                    original: match[0].trim(),
                    boost: 2.0
                });
            }
            // Remove matched pattern from remaining query
            remainingQuery = remainingQuery.replace(match[0], ' ');
        }
        pattern.regex.lastIndex = 0; // Reset regex
    });

    // Process other patterns...
    [buildingPatterns, departmentPatterns, staffPatterns].forEach(patternGroup => {
        patternGroup.forEach(pattern => {
            let match;
            while ((match = pattern.regex.exec(originalQuery)) !== null) {
                processedTerms.push({
                    type: pattern.type,
                    value: match[1].trim(),
                    original: match[0].trim(),
                    boost: pattern.type === 'building' ? 1.5 : 1.3
                });
                remainingQuery = remainingQuery.replace(match[0], ' ');
            }
            pattern.regex.lastIndex = 0;
        });
    });

    // Process remaining terms as general search
    const remainingTerms = remainingQuery
        .split(/[\s,]+/)
        .map(term => term.trim())
        .filter(term => term.length > 0)
        .filter(term => !/^(the|and|or|in|at|on|of|for|to|with|by)$/.test(term));

    remainingTerms.forEach(term => {
        // IMPROVED: Better room number detection
        if (/^[a-zA-Z]?\d+[a-zA-Z]?$/.test(term)) {
            // Matches: F4214T, 4214, F4214, 4214T, etc.
            processedTerms.push({
                type: 'room_number',
                value: term,
                original: term,
                boost: 3.0
            });
        } else {
            processedTerms.push({
                type: 'general',
                value: term,
                original: term,
                boost: 1.0
            });
        }
    });

    return processedTerms;
}


/**
 * FIXED: Calculates the match score for a single search term against a room.
 * This version adds fuzzy matching for room numbers (stripping prefixes/suffixes)
 * and better handles general term matching against various room properties.
 * @param {object} term The processed search term.
 * @param {object} room The room data object.
 * @param {string[]} roomTags The unified tags for the room.
 * @returns {{matched: boolean, score: number}} An object with match status and score.
 */
function calculateTermMatch(term, room, roomTags) {
    const termValue = term.value.toLowerCase();
    let score = 0;
    let matched = false;

    switch (term.type) {
        case 'floor':
            if (room.floor !== undefined && room.floor !== null) {
                // FIXED: Ensure both are strings for comparison
                if (room.floor.toString() === termValue.toString()) {
                    score = 10; // Perfect floor match
                    matched = true;
                }
            }
            break;

        case 'building':
            const buildingFields = [
                room.building,
                room.bld_descrshort
            ].filter(Boolean);

            for (let buildingField of buildingFields) {
                const buildingLower = buildingField.toLowerCase();
                if (buildingLower === termValue) {
                    score = 10; // Exact match
                    matched = true;
                    break;
                } else if (buildingLower.includes(termValue) && termValue.length >= 2) {
                    score = Math.max(score, 7); // Partial match
                    matched = true;
                } else if (termValue.includes(buildingLower) && buildingLower.length >= 2) {
                    score = Math.max(score, 6); // Reverse partial match
                    matched = true;
                }
            }
            break;

        case 'department':
            if (room.dept_descr) {
                const deptLower = room.dept_descr.toLowerCase();
                if (deptLower === termValue) {
                    score = 10;
                    matched = true;
                } else if (deptLower.includes(termValue) && termValue.length >= 2) {
                    score = 6;
                    matched = true;
                }
            }
            break;

        case 'room_type':
            if (room.typeFull) {
                const typeLower = room.typeFull.toLowerCase();
                if (typeLower === termValue) {
                    score = 10;
                    matched = true;
                } else if (typeLower.includes(termValue) && termValue.length >= 2) {
                    score = 6;
                    matched = true;
                }
            }
            break;

        case 'room_number':
            if (room.rmnbr) {
                const roomNum = room.rmnbr.toString().toLowerCase();
                const termLower = termValue.toLowerCase();

                if (roomNum === termLower) {
                    score = 15; // Exact match
                    matched = true;
                } else if (roomNum.includes(termLower) && termLower.length >= 2) {
                    score = 12; // Partial match (e.g., "4214" matches "F4214T")
                    matched = true;
                } else if (termLower.includes(roomNum) && roomNum.length >= 2) {
                    score = 10; // Reverse match
                    matched = true;
                }

                // IMPROVED: Additional fuzzy matching for room numbers
                // Remove common prefixes/suffixes for comparison
                const roomNumStripped = roomNum.replace(/^[a-z]+|[a-z]+$/g, ''); // Remove letter prefixes/suffixes
                const termStripped = termLower.replace(/^[a-z]+|[a-z]+$/g, '');

                if (roomNumStripped && termStripped && roomNumStripped === termStripped && !matched) {
                    score = 8; // Match without prefixes/suffixes
                    matched = true;
                }
            }
            break;

        case 'staff':
            const staffTags = state.staffTags[room.id] || [];
            for (let staffTag of staffTags) {
                const staffName = staffTag.replace('Staff: ', '').toLowerCase();
                if (staffName.includes(termValue) && termValue.length >= 2) {
                    score = staffName === termValue ? 10 : 6;
                    matched = true;
                    break;
                }
            }
            break;

        case 'general':
        default:
            // IMPROVED: Enhanced general term matching
            // Check room number first
            if (room.rmnbr) {
                const roomNum = room.rmnbr.toString().toLowerCase();
                if (roomNum === termValue) {
                    score = 12; // High score for exact room number match
                    matched = true;
                } else if (roomNum.includes(termValue) && termValue.length >= 2) {
                    score = Math.max(score, 8);
                    matched = true;
                } else if (termValue.includes(roomNum) && roomNum.length >= 2) {
                    score = Math.max(score, 6);
                    matched = true;
                }
            }

            // Check against room tags
            for (let tag of roomTags) {
                const tagLower = tag.toLowerCase();
                if (tagLower === termValue) {
                    score = Math.max(score, 8); // Exact tag match
                    matched = true;
                    break;
                } else if (tagLower.includes(termValue) && termValue.length >= 2) {
                    score = Math.max(score, 4); // Partial tag match
                    matched = true;
                } else if (termValue.includes(tagLower) && tagLower.length >= 2) {
                    score = Math.max(score, 3); // Reverse partial match  
                    matched = true;
                } else if (termValue.length >= 2 && tagLower.startsWith(termValue)) {
                    score = Math.max(score, 3); // Prefix match
                    matched = true;
                }
            }

            // IMPROVED: Check against abbreviated room types with expansion
            if (room.rmtyp_descrshort && !matched) {
                const roomType = room.rmtyp_descrshort.toLowerCase();

                // Direct match
                if (roomType.includes(termValue) && termValue.length >= 2) {
                    score = Math.max(score, 5);
                    matched = true;
                }

                // Check if the abbreviation expands to match the term
                const expandedType = abbreviationMap[room.rmtyp_descrshort];
                if (expandedType) {
                    const expandedLower = expandedType.toLowerCase();
                    if (expandedLower.includes(termValue) && termValue.length >= 2) {
                        score = Math.max(score, 6);
                        matched = true;
                    }
                }
            }

            break;
    }

    return { matched, score };
}


/**
 * FIXED: Searches rooms based on a query string with improved scoring and matching logic.
 * This version uses a more flexible matching threshold (60%) and gives special
 * consideration to high-priority matches like floor and room number.
 * @param {string} searchQuery The user's search query.
 * @returns {object[]} An array of sorted room objects that match the query.
 */
function searchRoomsByTags(searchQuery) {
    if (!searchQuery || !state.processedData.length) {
        return [...state.processedData];
    }

    const processedTerms = preprocessSearchQuery(searchQuery);

    if (processedTerms.length === 0) {
        return [...state.processedData];
    }

    // Score and rank results
    const scoredResults = state.processedData.map(room => {
        const roomTags = createUnifiedTags(room);
        let score = 0;
        let matchedTerms = 0;
        let highPriorityMatches = 0; // Track high-priority matches (room numbers, floors)
        const matchDetails = [];

        processedTerms.forEach(term => {
            const matchResult = calculateTermMatch(term, room, roomTags);
            if (matchResult.matched) {
                score += matchResult.score * term.boost;
                matchedTerms++;

                // Track high-priority matches
                if (term.type === 'room_number' || term.type === 'floor') {
                    highPriorityMatches++;
                }

                matchDetails.push({
                    term: term.original,
                    type: term.type,
                    score: matchResult.score,
                    boost: term.boost
                });
            }
        });

        // IMPROVED: More flexible matching logic
        let sufficientMatch = false;

        if (processedTerms.length === 1) {
            // Single term: must match
            sufficientMatch = matchedTerms >= 1;
        } else if (processedTerms.length === 2) {
            // Two terms: both should match, or one high-priority match
            sufficientMatch = matchedTerms >= 2 || highPriorityMatches >= 1;
        } else {
            // Multiple terms: more flexible threshold
            const baseThreshold = Math.ceil(processedTerms.length * 0.6); // Reduced from 0.7 to 0.6
            const minThreshold = Math.min(2, processedTerms.length); // At least 2 matches or all if fewer
            const actualThreshold = Math.max(minThreshold, baseThreshold);

            // If we have high-priority matches, be more lenient
            if (highPriorityMatches > 0) {
                sufficientMatch = matchedTerms >= Math.max(1, actualThreshold - 1);
            } else {
                sufficientMatch = matchedTerms >= actualThreshold;
            }
        }

        // Boost score for exact room number matches
        if (processedTerms.some(t => t.type === 'room_number' && room.rmnbr &&
            room.rmnbr.toString().toLowerCase() === t.value.toLowerCase())) {
            score *= 2;
        }

        // Boost score for rooms that match multiple high-priority terms
        if (highPriorityMatches > 1) {
            score *= 1.5;
        }

        return {
            room,
            score: sufficientMatch ? score : 0,
            matchedTerms,
            totalTerms: processedTerms.length,
            highPriorityMatches,
            matchDetails,
            included: sufficientMatch
        };
    });

    // Filter and sort results
    const results = scoredResults
        .filter(result => result.included)
        .sort((a, b) => {
            // First sort by score
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // Then by number of high-priority matches
            if (b.highPriorityMatches !== a.highPriorityMatches) {
                return b.highPriorityMatches - a.highPriorityMatches;
            }
            // Finally by total matches
            return b.matchedTerms - a.matchedTerms;
        })
        .map(result => result.room);

    // DEBUG: Log search results for troubleshooting
    if (results.length === 0 && processedTerms.length > 0) {
        console.log('🔍 Search Debug - No results found for:', searchQuery);
        console.log('📝 Processed terms:', processedTerms);
        console.log('🎯 Top 5 near-misses:');
        scoredResults
            .sort((a, b) => b.matchedTerms - a.matchedTerms || b.score - a.score)
            .slice(0, 5)
            .forEach(result => {
                console.log(`  Room ${result.room.rmnbr}: ${result.matchedTerms}/${result.totalTerms} matches, score: ${result.score}`);
            });
    }

    return results;
}
