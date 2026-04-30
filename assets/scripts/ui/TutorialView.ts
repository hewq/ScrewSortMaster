import { _decorator, Component, Label } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('TutorialView')
export class TutorialView extends Component {
  @property(Label)
  tipLabel: Label | null = null;

  protected onLoad(): void {
    console.log('TutorialView onLoad', {
      nodeName: this.node.name,
      tipLabel: !!this.tipLabel,
    });
  }

  showTip(text: string): void {
    console.log('TutorialView showTip', {
      text,
      tipLabel: !!this.tipLabel,
      nodeActiveBefore: this.node.active,
      nodeName: this.node.name,
    });

    this.node.active = true;

    if (this.tipLabel) {
      this.tipLabel.string = text;
    }
  }

  hide(): void {
    console.log('TutorialView hide');
    this.node.active = false;
  }
}