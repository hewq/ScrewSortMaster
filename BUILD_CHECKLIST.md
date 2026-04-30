# 抖音小游戏构建检查

## 构建前

- [ ] 删除 SaveManager.clear() 测试代码
- [ ] 删除 LevelExporter.exportGeneratedLevels() 测试代码
- [ ] 确认 LevelConfig 使用 FixedLevelConfigs
- [ ] 确认 TutorialView 默认 active = false
- [ ] 确认 StuckPopup 默认 active = false
- [ ] 确认 WinPopup 默认 active = false 或 onLoad 自动隐藏
- [ ] 确认 Toast 已拖到 GameManager
- [ ] 确认 AdService 缺广告位时 fallback mock
- [ ] 确认构建方向 Portrait

## 抖音开发者工具测试

- [ ] 游戏能启动
- [ ] 第 1 关能显示
- [ ] 新手引导正常
- [ ] 点击移动正常
- [ ] 通关弹窗正常
- [ ] 重开正常
- [ ] 撤回正常
- [ ] 提示正常
- [ ] 空柱正常
- [ ] 卡住弹窗正常
- [ ] Toast 正常
- [ ] 本地存档正常
