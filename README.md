# Supply Chain Graph Visualization

A powerful web application for visualizing and analyzing supply chain networks with support for massive datasets (2M+ nodes) and interactive graph exploration.

## 🚀 Features

- **Large File Support**: Upload JSON files up to 500MB with 2M+ nodes
- **Auto-Fix Data**: Automatically handles missing labels and invalid data fields
- **Real-time Upload Progress**: Visual feedback for large file processing
- **Dual Graph Libraries**: Switch between Sigma.js and Cosmos Graph
- **Path Highlighting**: Find shortest paths and all possible routes between nodes
- **Advanced Filtering**: Filter by node types, tiers, and risk scores
- **Crisis Simulation**: Model supply chain disruptions and cascading effects
- **Performance Modes**: Optimized rendering for different dataset sizes
- **Export Capabilities**: Save visualizations as PNG images

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Visualization**: Sigma.js + Cosmos Graph + D3.js
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Playwright
- **Deployment**: Vercel

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
git clone https://github.com/yevhen-o/graph.git
cd graph
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5174](http://localhost:5174)

### Build
```bash
npm run build
npm run preview
```

### Testing
```bash
npm run test              # Run all tests
npm run test:headed       # Run tests in headed mode
npm run test:ui           # Run tests with UI
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**:
   - Fork this repository
   - Connect your GitHub account to Vercel
   - Import the project in Vercel dashboard

2. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Vite

3. **Environment Variables** (optional):
   ```env
   VITE_APP_TITLE=Your App Title
   VITE_MAX_FILE_SIZE_MB=500
   VITE_PERFORMANCE_MODE=false
   ```

4. **Deploy**:
   - Push to main branch triggers automatic deployment
   - Large sample files automatically served from GitHub raw URLs

### Other Platforms

The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages  
- AWS S3 + CloudFront
- Firebase Hosting

## 📊 Data Format

Upload JSON files with this structure:

```json
{
  "nodes": [
    {
      "id": "node_1",
      "label": "Supplier Name", 
      "type": "supplier",
      "tier": 1,
      "location": {
        "lat": 40.7128,
        "lng": -74.0060,
        "country": "USA",
        "city": "New York"
      },
      "capacity": 1000,
      "riskScore": 0.3
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "type": "material_flow",
      "weight": 0.8,
      "volume": 100
    }
  ],
  "metadata": {
    "totalNodes": 2,
    "totalEdges": 1,
    "industry": "Electronics",
    "region": "Global"
  }
}
```

## 🔧 Configuration

### Performance Tuning
- **Small datasets** (<1K nodes): Default settings
- **Medium datasets** (1K-10K nodes): Enable Performance Mode
- **Large datasets** (10K-100K nodes): Use filtered views
- **Massive datasets** (100K+ nodes): Consider data sampling

### Browser Requirements
- **Minimum**: 4GB RAM, modern browser
- **Recommended**: 8GB+ RAM for large datasets
- **Optimal**: 16GB+ RAM for 2M+ node datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Commit with conventional commit format
6. Push and create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🐛 Issues

Report bugs and feature requests in the [GitHub Issues](https://github.com/yevhen-o/graph/issues) section.

## 🙏 Acknowledgments

- Sigma.js team for the excellent graph visualization library
- Cosmos Graph for WebGL-powered rendering
- React and Vite communities for the development tools