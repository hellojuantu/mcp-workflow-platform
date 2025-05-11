 # Workflow Platform

[English](README.en.md) | [简体中文](README.md)

A flexible and extensible workflow engine built with TypeScript, designed to handle complex business processes and automation tasks.

## Features

- 🚀 TypeScript-based workflow engine
- 🔌 Plugin architecture for extensibility
- 📝 Step-by-step workflow execution
- 🔄 Support for conditional branching
- 📊 Built-in logging and monitoring
- 🧪 Comprehensive test coverage

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd workflow-platform
```

2. Install dependencies:
```bash
npm install
```

## Development

To start the development server:

```bash
npm run dev
```

This will run the application using `tsx` for TypeScript execution.

## Building

To build the project:

```bash
npm run build
```

This will compile TypeScript files into JavaScript in the `dist` directory.

## Running the Build

After building, you can run the compiled code using:

```bash
node ./dist/index.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the project
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
workflow-platform/
├── src/              # Source files
│   ├── core/         # Core workflow engine
│   ├── types/        # TypeScript type definitions
│   └── config/       # Configuration files
├── dist/             # Compiled output
├── tests/            # Test files
└── package.json      # Project configuration
```

## Testing

The project includes comprehensive test coverage. Run tests using:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.