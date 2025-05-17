import path from 'path';
import DependencyTreeGenerator from './dependency-tree-generator';

async function main() {
  // 获取项目根目录
  const projectRoot = process.argv[2] || process.cwd();
  
  // 创建依赖树生成器实例
  const generator = new DependencyTreeGenerator(projectRoot);
  
  // 生成 HTML 报告
  const htmlOutputPath = path.join(projectRoot, 'dependency-tree.html');
  await generator.generateHtmlReport(htmlOutputPath);
  
  // 生成 JSON 报告
  const jsonOutputPath = path.join(projectRoot, 'dependency-tree.json');
  await generator.generateJsonReport(jsonOutputPath);
}

main().catch(console.error); 