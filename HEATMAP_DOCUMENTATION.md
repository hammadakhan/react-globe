# Heatmap Feature Documentation

## Overview
A new interactive heatmap view has been added to visualize cyber attack data in a tabular, color-coded format.

## Features

### Interactive Heatmap Grid
- **Color-coded cells**: Attack counts are represented with a gradient color scale (green to red)
- **Sortable columns**: Sort by attacks, severity, or country name
- **Clickable rows**: Click any row to see detailed country information
- **Hover effects**: Visual feedback when hovering over rows

### Filtering & Search
- **Region filter**: Filter data by geographic region (North America, Europe, Asia, etc.)
- **Search functionality**: Search for specific countries by name or code
- **Real-time updates**: Filters and search work together seamlessly

### Statistics Dashboard
- **Total Attacks**: Shows aggregate attack count across all filtered countries
- **Affected Countries**: Number of countries in current view
- **Average Severity**: Mean severity score across all attacks
- **Critical Threats**: Count of countries with severity ≥ 7

### Detail Panel
When a country is selected, a detailed panel appears showing:
- Total attacks for that country
- Primary targeted sector
- Average severity score with color coding
- Geographic region
- Threat level classification
- Global share percentage

### Data Structure

#### Static Data Format
```javascript
{
  country: "United States",
  code: "US",
  attacks: 1245,
  sector: "Healthcare",
  avgSeverity: 8.5,
  region: "North America"
}
```

## Routes

- **Globe View**: `/` - 3D globe visualization
- **Heatmap View**: `/heatmap` - Tabular heatmap visualization

## Navigation

- From Globe to Heatmap: Click "📊 Heatmap View" button in the controls
- From Heatmap to Globe: Click "🌍 Globe View" link in the navigation bar

## Replacing Static Data with API

To integrate API data, modify the `Heatmap.jsx` file:

### Current (Static):
```javascript
const staticHeatmapData = [
  { country: "United States", code: "US", attacks: 1245, ... },
  // ... more data
];
```

### Future (API):
```javascript
import { useState, useEffect } from "react";
import axios from "axios";

function Heatmap() {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    axios.get('YOUR_API_ENDPOINT')
      .then(response => {
        setHeatmapData(response.data);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Replace staticHeatmapData with heatmapData throughout the component
}
```

## Customization

### Color Scales
The heatmap uses d3-scale-chromatic's `interpolateRdYlGn` for attack intensity. To change:
```javascript
import { interpolateViridis } from "d3-scale-chromatic";
// Replace interpolateRdYlGn with interpolateViridis
```

### Severity Thresholds
Modify severity levels in the `getSeverityColor` and `getSeverityLabel` functions:
```javascript
const getSeverityColor = (severity) => {
  if (severity >= 7) return "#f44336"; // Critical
  if (severity >= 5) return "#ff9800"; // High
  return "#4caf50"; // Medium/Low
};
```

## Responsive Design

The heatmap is fully responsive:
- **Desktop**: Full grid with fixed detail panel on the right
- **Tablet**: Adjusted column widths and smaller panels
- **Mobile**: 
  - 2-column statistics grid
  - Scrollable horizontal grid
  - Bottom sheet-style detail panel
  - Touch-optimized controls

## Technologies Used

- **React**: Component framework
- **React Router DOM**: Client-side routing
- **D3-Scale**: Color scaling for data visualization
- **D3-Scale-Chromatic**: Color interpolation schemes
- **CSS Grid**: Layout system for the heatmap table

## Performance Considerations

- Uses `useMemo` for expensive calculations
- Efficient filtering and sorting algorithms
- Debounced search (can be added if needed)
- Optimized re-renders with proper React patterns

## Future Enhancements

- [ ] Export data to CSV
- [ ] Time-series filtering (date range picker)
- [ ] Advanced multi-column sorting
- [ ] Comparison mode (select multiple countries)
- [ ] Custom color scheme selector
- [ ] Print-friendly view
- [ ] Data refresh with loading states
- [ ] Pagination for large datasets
