# Smack AI Development Platform Packages

This directory contains the AI-powered development platform packages that extend Smack with React Native, Game Development, and Fullstack Integration capabilities.

## Package Structure

```
packages/
├── mobile-rn/              # React Native with Expo integration
├── game-engine/           # Game development engine with Phaser and Three.js
└── fullstack-integration/  # Fullstack application generator
```

## 📱 React Native with Expo (`@smack/mobile-rn`)

### Features

- **AI React Native Converter**: Automatically converts web React components to React Native
- **Component Transformation**: div→View, span→Text, className→style, onClick→onPress
- **Native Bridge Generation**: iOS (Swift) and Android (Kotlin) bridge code generation
- **TypeScript Interface Generation**: Auto-generated TypeScript interfaces for native modules
- **Expo Integration**: Expo Go instant preview, EAS Build pipeline integration
- **Platform-Specific Code**: .ios.tsx and .android.tsx file generation
- **React Navigation**: Automated navigation setup
- **Expo Modules**: Camera, location, notifications, permissions
- **App Store Deployment**: Configuration for iOS and Android app stores

### Usage

```typescript
import { ReactNativeAIConverter } from '@smack/mobile-rn';

const converter = new ReactNativeAIConverter();

// Convert web React to React Native
const nativeCode = converter.convertWebToNative(webReactCode);

// Generate native bridges
const iosBridge = converter.generateIOSNativeBridge('MyModule', ['method1', 'method2']);
const androidBridge = converter.generateAndroidNativeBridge('MyModule', ['method1', 'method2']);

// Generate Expo configuration
const expoConfig = converter.generateExpoConfig('MyApp', 'com.myapp.app');
```

### Installation

```bash
cd packages/mobile-rn
npm install
npm run build
```

## 🎮 Game Development Engine (`@smack/game-engine`)

### Features

- **Phaser Game Builder**: AI-powered game configuration generation
- **Game Templates**:
  - Platformer (Mario-style)
  - Top-down shooter
  - Puzzle game (Match-3)
  - Racing game
  - Tower defense
- **Three.js 3D Support**: 3D scene generation, model loading, WebGL optimization
- **Asset Generation**: DALL-E API integration for sprite generation
- **Audio Integration**: Suno AI and ElevenLabs for music and sound effects
- **AI Game Logic**: Procedural content generation, AI opponents
- **VR/AR Readiness**: WebXR integration for virtual and augmented reality

### Usage

```typescript
import { PhaserGameBuilder } from '@smack/game-engine';

const gameBuilder = new PhaserGameBuilder();

// Generate a platformer game
const platformerConfig = gameBuilder.generatePlatformerGame();

// Generate a top-down shooter
const shooterConfig = gameBuilder.generateTopDownShooter();

// Generate Three.js 3D scene
const threeJSScene = gameBuilder.generateThreeJSScene();

// Generate AI assets
const spriteGeneration = gameBuilder.generateDALLEIntegration();
```

### Installation

```bash
cd packages/game-engine
npm install
npm run build
```

## 🔧 Fullstack Integration (`@smack/fullstack-integration`)

### Features

- **Frontend Analysis**: Detect API requirements from frontend code
- **Automatic Backend Generation**: Express.js API endpoints with Zod validation
- **Database Schema Generation**: Prisma schema auto-generation with relations
- **Authentication Setup**: JWT/OAuth authentication with bcrypt password hashing
- **WebSocket Configuration**: Real-time features with Socket.IO
- **Middleware Generation**: Auth, rate limiting, logging, CORS
- **Deployment Integration**:
  - Vercel deployment configuration
  - AWS deployment setup (ECS, RDS, CloudFront)
  - Railway deployment automation
  - Docker containerization
- **CI/CD Pipeline**: GitHub Actions workflow generation
- **API Client Generation**: Type-safe frontend API client
- **Documentation Generation**: Auto-generated API documentation

### Usage

```typescript
import { FullstackAIGenerator } from '@smack/fullstack-integration';

const generator = new FullstackAIGenerator();

// Analyze frontend code
generator.analyzeFrontendCode(frontendCode);

// Generate complete backend
await generator.generateBackendApp('MyApp', './output');

// Generate Express server
const expressServer = generator.generateExpressServer();

// Generate Prisma schema
const prismaSchema = generator.generatePrismaSchema();

// Generate API endpoints
const apiEndpoints = generator.generateAPIEndpoints();
```

### Installation

```bash
cd packages/fullstack-integration
npm install
npm run build
```

## 🚀 Unified Platform Features

### Cross-Platform Code Sharing

- Shared business logic between web, mobile, desktop
- Platform-specific UI adaptations
- Unified state management
- Consistent API interfaces

### AI Development Pipeline

- Natural language → Working applications
- Multi-platform deployment automation
- Real-time collaboration features
- Version control integration

### Template Ecosystem

- Desktop app templates (Tauri)
- Mobile app templates (React Native/Flutter)
- Game templates (Phaser/Three.js)
- Fullstack templates (Next.js/Express)
- Custom template creation

### Development Tools

- Monaco editor with multi-language support
- Live preview for all platforms
- Hot reload and instant updates
- Performance monitoring
- Debugging interfaces

## 📦 Package Development

Each package is a standalone TypeScript module with its own:

- `package.json` - Package configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `src/` - Source code
- `dist/` - Compiled output (generated on build)

### Building All Packages

```bash
# Build all packages
cd packages/mobile-rn && npm run build
cd ../game-engine && npm run build
cd ../fullstack-integration && npm run build

# Or build individually
cd packages/mobile-rn
npm run build
```

### Development Mode

```bash
# Watch for changes and rebuild
npm run dev
```

## 🧪 Testing

Each package includes comprehensive testing capabilities:

### React Native Testing

- Convert web React components successfully
- Expo Go preview works across platforms
- Platform-specific code generates correctly
- Navigation flows function properly
- EAS build completes successfully
- App runs on device in <3 minutes

### Game Development Testing

- Generate playable games from prompts
- Browser-based game execution
- Sprite generation integration
- Physics system functionality
- User controls responsiveness
- Playable game in <10 minutes

### Fullstack Integration Testing

- Backend generation from frontend analysis
- API endpoint functionality validation
- Database schema correctness
- Authentication flow testing
- WebSocket real-time features
- Full-stack app deployment in <15 minutes

## 🎯 Success Criteria

- ✅ React Native app running on device in <3 minutes
- ✅ Playable game generated in <10 minutes
- ✅ Full-stack app deployed in <15 minutes
- ✅ Cross-platform code sharing works seamlessly
- ✅ All security and permission models enforced
- ✅ Performance optimization across platforms

## 📚 Architecture

### Unified AI Interface

All development types share a common AI interface for:
- Natural language processing
- Code generation
- Asset creation
- Deployment automation

### Plugin Architecture

Extensible plugin system for:
- Additional game engines
- New mobile frameworks
- Custom backend templates
- Specialized AI models

### Build Pipeline Orchestration

Centralized build management across:
- Web applications
- Desktop applications
- Mobile applications
- Game projects

### Asset Management

Unified asset generation and management:
- Sprite generation (DALL-E)
- Music and sound effects (Suno AI, ElevenLabs)
- 3D models and textures
- Icon and UI asset generation

### Deployment Automation

One-click deployment to:
- Mobile app stores (iOS, Android)
- Web hosting (Vercel, Netlify)
- Cloud platforms (AWS, Railway)
- Desktop platforms (Windows, macOS, Linux)

## 🤝 Integration with Existing PR

This implementation extends the existing AI-powered desktop and mobile app builder with comprehensive capabilities for:

1. **React Native Development**: Full Expo integration with AI-powered conversion
2. **Game Development**: Phaser and Three.js support with AI asset generation
3. **Fullstack Development**: Express.js and Prisma backend generation

Creating a complete AI-powered development platform that can generate applications for web, desktop, mobile, and games from natural language prompts.

## 📈 Performance Optimization

All packages include performance optimizations:
- WebGL optimization for games
- React Native performance tuning
- Backend response caching
- Database query optimization
- Asset compression and optimization

## 🔒 Security

Comprehensive security features:
- JWT authentication with secure storage
- Input validation with Zod schemas
- Rate limiting and DDoS protection
- Secure password hashing (bcrypt)
- CORS and CSRF protection
- SQL injection prevention (Prisma ORM)

## 🌐 Cross-Platform Support

- **Web**: React, Remix, Next.js
- **Desktop**: Electron, Tauri
- **Mobile**: React Native, Flutter, Expo
- **Games**: Phaser, Three.js, WebGL
- **Backend**: Express.js, Prisma, PostgreSQL

## 🚀 Getting Started

To use these packages in your Smack application:

1. **Install dependencies**:
```bash
npm install
```

2. **Build packages**:
```bash
cd packages/mobile-rn && npm run build
cd ../game-engine && npm run build
cd ../fullstack-integration && npm run build
```

3. **Import in your application**:
```typescript
import { ReactNativeAIConverter } from '@smack/mobile-rn';
import { PhaserGameBuilder } from '@smack/game-engine';
import { FullstackAIGenerator } from '@smack/fullstack-integration';
```

4. **Start building AI-powered applications!**

## 📝 License

All packages are licensed under the MIT License. See the [LICENSE](../../LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please see the [CONTRIBUTING](../../CONTRIBUTING.md) guidelines.

## 📞 Support

For support, please contact the Smack team at maintainers@smack.sh or open an issue in the repository.