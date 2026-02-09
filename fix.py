#!/usr/bin/env python3
import os
import json
import subprocess
import sys
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set
import google.generativeai as genai

# Configuration
GEMINI_API_KEY = "AIzaSyD97jkj4oaAGvlZBZt7XTRC_7Wdn_52J6c"  # Replace with your actual API key
PROJECT_ROOT = Path(__file__).parent.absolute()
CODE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.html', '.css'}

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

class CodeAnalyzer:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.dependency_graph: Dict[str, List[str]] = {}
        self.files_to_fix: Set[Path] = set()
        
    def get_all_code_files(self) -> List[Path]:
        """Get all code files in the project"""
        code_files = []
        for ext in CODE_EXTENSIONS:
            code_files.extend(self.root_dir.glob(f'**/*{ext}'))
        return code_files
    
    def analyze_dependencies(self, file_path: Path) -> List[str]:
        """Analyze imports/dependencies of a file"""
        if not file_path.exists():
            return []
            
        content = file_path.read_text()
        imports = []
        
        # TypeScript/JavaScript imports
        ts_imports = re.findall(
            r'import\s+(?:\{[^}]*\}|\* as \w+|\w+)\s+from\s+[\'"]([^\'"]+)[\'"]', 
            content
        )
        imports.extend(ts_imports)
        
        # Python imports
        py_imports = re.findall(
            r'^(?:from\s+([\w.]+)\s+)?import\s+([\w.,\s]+)',
            content,
            re.MULTILINE
        )
        for module, names in py_imports:
            if module:
                imports.append(module.split('.')[0])
            else:
                imports.extend([n.strip() for n in names.split(',')])
                
        return imports
    
    def build_dependency_graph(self):
        """Build a graph of file dependencies"""
        code_files = self.get_all_code_files()
        for file_path in code_files:
            rel_path = str(file_path.relative_to(self.root_dir))
            self.dependency_graph[rel_path] = self.analyze_dependencies(file_path)
    def fix_file(self, file_path: Path) -> Optional[str]:
        """
        Use AI to fix a single file
        
        Args:
            file_path: Path to the file to fix
            
        Returns:
            str: Fixed code if successful, None otherwise
        """
        try:
            content = file_path.read_text()
            
            prompt = f"""
            Analyze and fix the following {file_path.suffix} code. 
            Fix any syntax errors, dependency issues, or logical errors.
            Preserve the exact formatting and structure of the code.
            Only respond with the fixed code, no explanations or markdown code blocks.
            
            {content}
            """
            
            response = model.generate_content(prompt)
            fixed_code = response.text
            
            # Clean up the response to remove any markdown code blocks
            if fixed_code.startswith("```"):
                lines = fixed_code.split('\n')
                if len(lines) > 2 and lines[-1].strip() == "```":
                    fixed_code = '\n'.join(lines[1:-1])
                else:
                    # In case the closing ``` is missing
                    fixed_code = '\n'.join(lines[1:])
            
            return fixed_code.strip()
        except Exception as e:
            print(f"Error fixing {file_path}: {str(e)}")
            return None

    def fix_dependencies(self):
        """Fix dependencies in the project"""
        print("🔍 Analyzing project structure...")
        self.build_dependency_graph()
        
        # Process files in dependency order (leaves first)
        processed = set()
        while len(processed) < len(self.dependency_graph):
            for file_path, deps in self.dependency_graph.items():
                if file_path in processed:
                    continue
                    
                # If all dependencies are processed or have no dependencies
                if all(dep in processed or not deps for dep in deps):
                    full_path = self.root_dir / file_path
                    print(f"🛠️  Processing {file_path}...")
                    
                    fixed_code = self.fix_file(full_path)
                    if fixed_code:
                        full_path.write_text(fixed_code)
                    
                    processed.add(file_path)
                    break

def main():
    print("🚀 Starting AI-powered code fixer...")
    
    # Check for required tools
    try:
        subprocess.run(['node', '--version'], check=True, capture_output=True)
        subprocess.run(['npm', '--version'], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print("❌ Node.js and npm are required but not found. Please install them first.")
        sys.exit(1)
    
    # Initialize and run the analyzer
    analyzer = CodeAnalyzer(PROJECT_ROOT)
    
    try:
        analyzer.fix_dependencies()
        print("\n✅ Code fixing completed successfully!")
        
        # Install dependencies and run the project
        print("\n🚀 Installing dependencies and starting the application...")
        subprocess.run(['npm', 'install'], check=True)
        subprocess.run(['npm', 'run', 'dev'], check=True)
        
    except Exception as e:
        print(f"\n❌ An error occurred: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()