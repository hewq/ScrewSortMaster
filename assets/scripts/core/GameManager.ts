import {
  _decorator,
  Button,
  Component,
  Label,
  Node,
  tween,
  UITransform,
  Vec3,
} from "cc";
import { LevelConfig, LevelConfigs } from "../data/LevelConfig";
import { SlotView } from "../game/SlotView";
import { SaveManager } from "./SaveManager";
import { AnalyticsService } from "./AnalyticsService";
import { WinPopup } from "../ui/WinPopup";
import { TutorialView } from "../ui/TutorialView";
import { StuckPopup } from "../ui/StuckPopup";
import { AdService } from "../platform/AdService";
import { Toast } from "../ui/Toast";

const { ccclass, property } = _decorator;

type BoardState = number[][];

interface MoveRecord {
  from: number;
  to: number;
  colorId: number;
}

@ccclass("GameManager")
export class GameManager extends Component {
  @property(Node)
  boardRoot: Node | null = null;

  @property(Label)
  levelLabel: Label | null = null;

  @property(Button)
  restartButton: Button | null = null;

  @property(Button)
  undoButton: Button | null = null;

  @property(Button)
  nextButton: Button | null = null;

  @property(WinPopup)
  winPopup: WinPopup | null = null;

  @property(Button)
  hintButton: Button | null = null;

  @property(Button)
  addSlotButton: Button | null = null;

  @property(TutorialView)
  tutorialView: TutorialView | null = null;

  @property(StuckPopup)
  stuckPopup: StuckPopup | null = null;

  @property(Toast)
  toast: Toast | null = null;

  @property(Label)
  moveCountLabel: Label | null = null;

  private currentLevelIndex = 0;
  private currentLevel: LevelConfig | null = null;
  private board: BoardState = [];
  private slotViews: SlotView[] = [];
  private selectedSlotIndex: number | null = null;
  private moveHistory: MoveRecord[] = [];
  private isLevelCompleted = false;
  private isAnimating = false;
  private hintFromIndex: number | null = null;
  private hintToIndex: number | null = null;
  private hasUsedExtraSlot = false;
  private isTutorialActive = false;
  private hasTutorialMovedOnce = false;
  private isShowingRewardAd = false;

  protected onLoad(): void {
    this.restartButton?.node.on(
      Button.EventType.CLICK,
      this.restartLevel,
      this,
    );
    this.undoButton?.node.on(Button.EventType.CLICK, this.undoMove, this);
    this.nextButton?.node.on(Button.EventType.CLICK, this.goNextLevel, this);
    this.hintButton?.node.on(
      Button.EventType.CLICK,
      this.handleHintButtonClick,
      this,
    );
    this.addSlotButton?.node.on(
      Button.EventType.CLICK,
      this.handleAddSlotButtonClick,
      this,
    );

    this.currentLevelIndex = SaveManager.getCurrentLevelIndex();
    this.loadLevel(this.currentLevelIndex);
  }

  private refreshMoveCountLabel(): void {
    if (!this.moveCountLabel) return;

    this.moveCountLabel.string = `移动步数：${this.moveHistory.length}`;
  }

  private handleAddSlotButtonClick(): void {
    if (!this.currentLevel) return;
    if (this.isLevelCompleted) return;
    if (this.isAnimating) return;
    if (this.isShowingRewardAd) return;

    if (this.hasUsedExtraSlot) {
      console.log("本关已经使用过临时空柱");
      return;
    }

    this.isShowingRewardAd = true;
    this.refreshToolButtons();

    AnalyticsService.track("reward_ad_request", {
      levelId: this.currentLevel.id,
      placement: "extra_slot",
    });

    AdService.showRewardAd({
      placement: "extra_slot",
      onSuccess: () => {
        this.isShowingRewardAd = false;
        this.refreshToolButtons();

        AnalyticsService.track("reward_ad_success", {
          levelId: this.currentLevel?.id,
          placement: "extra_slot",
        });

        this.addExtraSlot();
      },
      onCancel: () => {
        this.isShowingRewardAd = false;
        this.refreshToolButtons();

        AnalyticsService.track("reward_ad_cancel", {
          levelId: this.currentLevel?.id,
          placement: "extra_slot",
        });

        this.toast?.show("完整观看广告后才能获得奖励");
      },
      onFail: (reason) => {
        this.isShowingRewardAd = false;
        this.refreshToolButtons();

        AnalyticsService.track("reward_ad_fail", {
          levelId: this.currentLevel?.id,
          placement: "extra_slot",
          reason,
        });

        this.toast?.show("广告暂时不可用，请稍后再试");

        console.log("广告加载失败，暂时无法增加空柱", reason);
      },
    });
  }

  private handleHintButtonClick(): void {
    if (!this.currentLevel) return;
    if (this.isLevelCompleted) return;
    if (this.isAnimating) return;
    if (this.isShowingRewardAd) return;

    this.isShowingRewardAd = true;
    this.refreshToolButtons();

    AnalyticsService.track("reward_ad_request", {
      levelId: this.currentLevel.id,
      placement: "hint",
    });

    AdService.showRewardAd({
      placement: "hint",
      onSuccess: () => {
        this.isShowingRewardAd = false;
        this.refreshToolButtons();

        AnalyticsService.track("reward_ad_success", {
          levelId: this.currentLevel?.id,
          placement: "hint",
        });

        this.showHint();
      },
      onCancel: () => {
        this.isShowingRewardAd = false;
        this.refreshToolButtons();

        AnalyticsService.track("reward_ad_cancel", {
          levelId: this.currentLevel?.id,
          placement: "hint",
        });

        this.toast?.show("完整观看广告后才能获得奖励");
      },
      onFail: (reason) => {
        this.isShowingRewardAd = false;
        this.refreshToolButtons();

        AnalyticsService.track("reward_ad_fail", {
          levelId: this.currentLevel?.id,
          placement: "hint",
          reason,
        });

        this.toast?.show("广告暂时不可用，请稍后再试");

        console.log("广告加载失败，暂时无法使用提示", reason);
      },
    });
  }

  private loadLevel(levelIndex: number): void {
    const safeIndex = Math.min(levelIndex, LevelConfigs.length - 1);
    this.currentLevelIndex = safeIndex;
    this.currentLevel = LevelConfigs[safeIndex];

    console.log("Load Level:", JSON.stringify(this.currentLevel));

    this.board = this.cloneBoard(this.currentLevel.slots);
    this.moveHistory = [];
    this.refreshMoveCountLabel();
    this.selectedSlotIndex = null;
    this.clearHint();
    this.isLevelCompleted = false;
    this.isAnimating = false;
    this.hasUsedExtraSlot = false;
    this.stuckPopup?.hide();
    this.isTutorialActive =
      this.currentLevelIndex === 0 && !SaveManager.isTutorialDone();

    this.hasTutorialMovedOnce = false;

    SaveManager.setCurrentLevelIndex(safeIndex);

    if (this.levelLabel) {
      this.levelLabel.string = `第 ${this.currentLevel.id} 关`;
    }

    AnalyticsService.track("level_start", {
      levelId: this.currentLevel.id,
    });

    this.renderBoard();
    this.refreshToolButtons();
    this.updateTutorialTip();
  }

  private hasAnyValidMove(): boolean {
    if (!this.currentLevel) return false;

    for (let from = 0; from < this.board.length; from++) {
      for (let to = 0; to < this.board.length; to++) {
        if (from === to) continue;

        if (this.canMove(from, to)) {
          return true;
        }
      }
    }

    return false;
  }

  private showStuckPopup(): void {
    if (!this.currentLevel) return;
    if (this.isLevelCompleted) return;
    if (this.isAnimating) return;

    AnalyticsService.track("level_stuck", {
      levelId: this.currentLevel.id,
      moveCount: this.moveHistory.length,
      hasUsedExtraSlot: this.hasUsedExtraSlot,
    });

    this.stuckPopup?.show({
      canUseExtraSlot: !this.hasUsedExtraSlot,
      onHint: () => {
        AnalyticsService.track("stuck_popup_hint_click", {
          levelId: this.currentLevel?.id,
        });

        this.handleHintButtonClick();
      },
      onAddSlot: () => {
        AnalyticsService.track("stuck_popup_extra_slot_click", {
          levelId: this.currentLevel?.id,
        });

        this.handleAddSlotButtonClick();
      },
      onRestart: () => {
        AnalyticsService.track("stuck_popup_restart_click", {
          levelId: this.currentLevel?.id,
        });

        this.restartLevel();
      },
    });
  }

  private updateTutorialTip(): void {
    if (!this.tutorialView) return;

    if (!this.isTutorialActive) {
      this.tutorialView.hide();
      return;
    }

    if (this.hasTutorialMovedOnce) {
      this.tutorialView.hide();
      return;
    }

    if (this.selectedSlotIndex === null) {
      this.tutorialView.showTip("点击一根柱子，选中最上面的螺丝");
    } else {
      this.tutorialView.showTip("再点击相同颜色或空柱，就可以移动");
    }
  }

  private addExtraSlot(): void {
    if (!this.currentLevel) return;
    if (this.isLevelCompleted) return;
    if (this.isAnimating) return;

    if (this.hasUsedExtraSlot) {
      console.log("本关已经使用过临时空柱");

      AnalyticsService.track("extra_slot_already_used", {
        levelId: this.currentLevel.id,
      });

      return;
    }

    this.hasUsedExtraSlot = true;
    this.board.push([]);

    this.clearHint();
    this.clearSelection();

    AnalyticsService.track("extra_slot_add", {
      levelId: this.currentLevel.id,
      slotCount: this.board.length,
    });

    this.renderBoard();
    this.refreshToolButtons();
  }

  private refreshToolButtons(): void {
    const toolEnabled =
      !this.isLevelCompleted &&
      !this.isTutorialActive &&
      !this.isShowingRewardAd;

    if (this.addSlotButton) {
      this.addSlotButton.interactable = toolEnabled && !this.hasUsedExtraSlot;
    }

    if (this.hintButton) {
      this.hintButton.interactable = toolEnabled;
    }

    if (this.undoButton) {
      this.undoButton.interactable = toolEnabled && this.moveHistory.length > 0;
    }
  }

  private renderBoard(): void {
    if (!this.boardRoot || !this.currentLevel) return;

    this.boardRoot.removeAllChildren();
    this.slotViews = [];

    const layout = this.getBoardLayout(this.board.length);

    this.board.forEach((slotColors, index) => {
      const row = Math.floor(index / layout.columnsPerRow);
      const col = index % layout.columnsPerRow;

      const slotNode = new Node(`Slot_${index}`);
      slotNode.setParent(this.boardRoot);

      const transform = slotNode.addComponent(UITransform);
      transform.setContentSize(
        layout.slotContentWidth,
        layout.slotContentHeight,
      );

      const rowCount = Math.ceil(this.board.length / layout.columnsPerRow);

      const totalWidth = layout.columnsPerRow * layout.slotGapX;
      const totalHeight = rowCount * layout.slotGapY;

      const startX = -totalWidth / 2 + layout.slotGapX / 2;
      const startY = totalHeight / 2 - layout.slotGapY / 2;

      const x = startX + col * layout.slotGapX;
      const y = startY - row * layout.slotGapY;

      slotNode.setPosition(new Vec3(x, y, 0));

      const slotView = slotNode.addComponent(SlotView);
      slotView.init(
        index,
        slotColors,
        this.currentLevel.maxStack,
        this.handleSlotClick.bind(this),
        layout.scale,
      );

      this.slotViews.push(slotView);
    });
  }

  private getBoardLayout(slotCount: number): {
    columnsPerRow: number;
    slotGapX: number;
    slotGapY: number;
    slotContentWidth: number;
    slotContentHeight: number;
    scale: number;
  } {
    if (slotCount <= 3) {
      return {
        columnsPerRow: slotCount,
        slotGapX: 155,
        slotGapY: 430,
        slotContentWidth: 120,
        slotContentHeight: 420,
        scale: 1,
      };
    }

    if (slotCount <= 4) {
      return {
        columnsPerRow: 4,
        slotGapX: 145,
        slotGapY: 420,
        slotContentWidth: 120,
        slotContentHeight: 420,
        scale: 0.95,
      };
    }

    if (slotCount <= 6) {
      return {
        columnsPerRow: 3,
        slotGapX: 150,
        slotGapY: 380,
        slotContentWidth: 120,
        slotContentHeight: 420,
        scale: 0.9,
      };
    }

    if (slotCount <= 8) {
      return {
        columnsPerRow: 4,
        slotGapX: 135,
        slotGapY: 360,
        slotContentWidth: 120,
        slotContentHeight: 420,
        scale: 0.82,
      };
    }

    return {
      columnsPerRow: 5,
      slotGapX: 118,
      slotGapY: 320,
      slotContentWidth: 120,
      slotContentHeight: 420,
      scale: 0.72,
    };
  }

  private refreshBoard(): void {
    this.board.forEach((slotColors, index) => {
      const slotView = this.slotViews[index];
      if (!slotView) return;

      slotView.updatePieces(slotColors);
      slotView.setSelected(this.selectedSlotIndex === index);
      slotView.setHinted(
        this.hintFromIndex === index || this.hintToIndex === index,
      );
    });
  }

  private clearHint(): void {
    this.hintFromIndex = null;
    this.hintToIndex = null;
  }

  private handleSlotClick(slotIndex: number): void {
    if (this.isLevelCompleted) return;
    if (this.isAnimating) return;
    if (!this.currentLevel) return;

    if (this.selectedSlotIndex === null) {
      this.selectSlot(slotIndex);
      return;
    }

    if (this.selectedSlotIndex === slotIndex) {
      this.clearSelection();
      return;
    }

    const from = this.selectedSlotIndex;
    const to = slotIndex;

    if (this.canMove(from, to)) {
      this.movePieceWithAnimation(from, to);
    } else {
      if (this.board[slotIndex].length > 0) {
        this.selectSlot(slotIndex);
      } else {
        this.clearSelection();
      }
    }
  }

  private movePieceWithAnimation(from: number, to: number): void {
    if (!this.currentLevel || !this.boardRoot) return;

    const fromSlotView = this.slotViews[from];
    const toSlotView = this.slotViews[to];

    if (!fromSlotView || !toSlotView) return;

    const movingNode = fromSlotView.removeTopPieceNode();

    if (!movingNode) return;

    this.isAnimating = true;

    const startWorldPos = fromSlotView.getTopPieceWorldPosition();
    const endWorldPos = toSlotView.getNextPieceWorldPosition();

    movingNode.setParent(this.boardRoot);

    const boardTransform = this.boardRoot.getComponent(UITransform);
    if (!boardTransform) {
      movingNode.destroy();
      this.isAnimating = false;
      return;
    }

    const startLocalPos = boardTransform.convertToNodeSpaceAR(startWorldPos);
    const endLocalPos = boardTransform.convertToNodeSpaceAR(endWorldPos);

    movingNode.setPosition(startLocalPos);

    tween(movingNode)
      .to(0.18, {
        position: new Vec3(startLocalPos.x, startLocalPos.y + 80, 0),
      })
      .to(0.22, {
        position: endLocalPos,
      })
      .call(() => {
        movingNode.destroy();

        this.movePiece(from, to);
        this.refreshMoveCountLabel();

        if (this.isTutorialActive && !this.hasTutorialMovedOnce) {
          this.hasTutorialMovedOnce = true;
          this.isTutorialActive = false;
          SaveManager.setTutorialDone(true);
          this.refreshToolButtons();

          AnalyticsService.track("tutorial_done", {
            levelId: this.currentLevel?.id,
          });
        }

        this.clearHint();
        this.clearSelection();

        AnalyticsService.track("move_piece", {
          levelId: this.currentLevel?.id,
          from,
          to,
        });

        this.refreshBoard();
        this.refreshToolButtons();
        this.isAnimating = false;

        if (this.checkWin()) {
          this.handleWin();
          return;
        }

        if (!this.hasAnyValidMove()) {
          this.showStuckPopup();
        }
      })
      .start();
  }

  private showHint(): void {
    if (this.isLevelCompleted) return;
    if (this.isAnimating) return;
    if (!this.currentLevel) return;

    const hintMove = this.findHintMove();

    if (!hintMove) {
      console.log("当前没有可提示的移动");

      AnalyticsService.track("hint_no_move", {
        levelId: this.currentLevel.id,
      });

      return;
    }

    this.hintFromIndex = hintMove.from;
    this.hintToIndex = hintMove.to;
    this.selectedSlotIndex = null;

    this.refreshBoard();

    AnalyticsService.track("hint_show", {
      levelId: this.currentLevel.id,
      from: hintMove.from,
      to: hintMove.to,
    });
  }

  private findHintMove(): { from: number; to: number } | null {
    const sameColorMove = this.findSameColorMove();
    if (sameColorMove) return sameColorMove;

    const emptySlotMove = this.findEmptySlotMove();
    if (emptySlotMove) return emptySlotMove;

    return null;
  }

  private findSameColorMove(): { from: number; to: number } | null {
    for (let from = 0; from < this.board.length; from++) {
      const fromSlot = this.board[from];
      if (fromSlot.length === 0) continue;

      const movingColor = fromSlot[fromSlot.length - 1];

      for (let to = 0; to < this.board.length; to++) {
        if (from === to) continue;

        const toSlot = this.board[to];
        if (toSlot.length === 0) continue;

        const targetTopColor = toSlot[toSlot.length - 1];

        if (movingColor !== targetTopColor) continue;
        if (!this.canMove(from, to)) continue;
        if (this.isMoveMeaningless(from, to)) continue;

        return { from, to };
      }
    }

    return null;
  }

  private findEmptySlotMove(): { from: number; to: number } | null {
    for (let from = 0; from < this.board.length; from++) {
      const fromSlot = this.board[from];
      if (fromSlot.length === 0) continue;

      if (this.isSlotCompleted(from)) continue;

      for (let to = 0; to < this.board.length; to++) {
        if (from === to) continue;

        const toSlot = this.board[to];
        if (toSlot.length !== 0) continue;

        if (!this.canMove(from, to)) continue;
        if (this.isMoveMeaningless(from, to)) continue;

        return { from, to };
      }
    }

    return null;
  }

  private isSlotCompleted(slotIndex: number): boolean {
    if (!this.currentLevel) return false;

    const slot = this.board[slotIndex];
    if (slot.length !== this.currentLevel.maxStack) return false;

    const firstColor = slot[0];
    return slot.every((color) => color === firstColor);
  }

  private isMoveMeaningless(from: number, to: number): boolean {
    if (this.isSlotCompleted(from)) {
      return true;
    }

    const fromSlot = this.board[from];
    const toSlot = this.board[to];

    if (fromSlot.length === 0) return true;

    // 避免把一个单独颜色从空柱挪到另一个空柱
    if (toSlot.length === 0 && this.isSlotSingleColor(from)) {
      return true;
    }

    return false;
  }

  private isSlotSingleColor(slotIndex: number): boolean {
    const slot = this.board[slotIndex];

    if (slot.length === 0) return false;

    const firstColor = slot[0];
    return slot.every((color) => color === firstColor);
  }

  private selectSlot(slotIndex: number): void {
    if (this.board[slotIndex].length === 0) return;

    this.selectedSlotIndex = slotIndex;
    this.refreshBoard();
    this.updateTutorialTip();
  }

  private clearSelection(): void {
    this.selectedSlotIndex = null;
    this.refreshBoard();
    this.updateTutorialTip();
  }

  private canMove(from: number, to: number): boolean {
    if (!this.currentLevel) return false;
    if (from === to) return false;

    const fromSlot = this.board[from];
    const toSlot = this.board[to];

    if (!fromSlot || !toSlot) return false;
    if (fromSlot.length === 0) return false;
    if (toSlot.length >= this.currentLevel.maxStack) return false;

    const movingColor = fromSlot[fromSlot.length - 1];

    if (toSlot.length === 0) return true;

    const targetTopColor = toSlot[toSlot.length - 1];
    return movingColor === targetTopColor;
  }

  private movePiece(from: number, to: number): void {
    const fromSlot = this.board[from];
    const toSlot = this.board[to];

    const movingColor = fromSlot.pop();
    if (movingColor === undefined) return;

    toSlot.push(movingColor);

    this.moveHistory.push({
      from,
      to,
      colorId: movingColor,
    });
  }

  private undoMove(): void {
    if (this.isLevelCompleted) return;

    const lastMove = this.moveHistory.pop();
    if (!lastMove) return;

    const toSlot = this.board[lastMove.to];
    const fromSlot = this.board[lastMove.from];

    const colorId = toSlot.pop();
    if (colorId === undefined) return;

    fromSlot.push(colorId);

    this.clearSelection();
    this.refreshBoard();
    this.refreshToolButtons();
    this.refreshMoveCountLabel();

    AnalyticsService.track("undo_move", {
      levelId: this.currentLevel?.id,
    });
  }

  private restartLevel(): void {
    AnalyticsService.track("level_restart", {
      levelId: this.currentLevel?.id,
    });

    this.loadLevel(this.currentLevelIndex);
  }

  private goNextLevel(): void {
    const nextIndex = this.currentLevelIndex + 1;

    if (nextIndex >= LevelConfigs.length) {
      console.log("已经是最后一关");
      return;
    }

    this.loadLevel(nextIndex);
  }

  private checkWin(): boolean {
    if (!this.currentLevel) return false;

    return this.board.every((slot) => {
      if (slot.length === 0) return true;
      if (slot.length !== this.currentLevel!.maxStack) return false;

      const firstColor = slot[0];
      return slot.every((color) => color === firstColor);
    });
  }

  private handleWin(): void {
    if (!this.currentLevel) return;

    this.isLevelCompleted = true;

    AnalyticsService.track("level_success", {
      levelId: this.currentLevel.id,
      moveCount: this.moveHistory.length,
    });

    console.log(`第 ${this.currentLevel.id} 关通关`);

    const nextIndex = Math.min(
      this.currentLevelIndex + 1,
      LevelConfigs.length - 1,
    );
    SaveManager.setCurrentLevelIndex(nextIndex);

    this.refreshToolButtons();

    this.winPopup?.show({
      levelId: this.currentLevel.id,
      moveCount: this.moveHistory.length,
      onNext: () => {
        this.goNextLevel();
      },
      onReplay: () => {
        this.restartLevel();
      },
    });
  }

  private cloneBoard(board: BoardState): BoardState {
    return board.map((slot) => [...slot]);
  }
}
