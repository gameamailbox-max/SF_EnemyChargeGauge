/*:
 * @target MZ
 * @plugindesc TPB戦闘時、エネミー画像の下部にチャージタイムゲージを表示します。
 * @author 巣ごもり梟
 *
 * @help
 * SF_EnemyChargeGauge_Ver1.js
 * Version: 1.1.0
 *
 * タイムプログレスバトル（TPB）時、
 * 各エネミー画像の下部にチャージタイムゲージを表示します。
 *
 * ゲージの基準位置は、
 * エネミー画像の下端中央です。
 *
 * Xオフセット、Yオフセットを変更することで、
 * 基準位置から相対的にゲージ位置を調整できます。
 *
 *
 * ■位置について
 *
 * プラグインパラメータの
 * 「Xオフセット」「Yオフセット」は、
 * すべてのエネミーに共通して適用されます。
 *
 * Xオフセット
 *
 *   0   = 基準位置
 *   正数 = 右へ移動
 *   負数 = 左へ移動
 *
 * Yオフセット
 *
 *   0   = エネミー画像の下端
 *   正数 = 下へ移動
 *   負数 = 上へ移動
 *
 *
 * ■エネミーごとの位置調整
 *
 * データベースの「敵キャラ」にあるメモ欄を使用して、
 * エネミーごとにゲージ位置を個別調整できます。
 *
 * 横方向を調整する場合：
 *
 * <CTGaugeX:20>
 *
 * 正数で右、負数で左へ移動します。
 *
 * 縦方向を調整する場合：
 *
 * <CTGaugeY:-40>
 *
 * 正数で下、負数で上へ移動します。
 *
 * 両方を指定する場合：
 *
 * <CTGaugeX:20>
 * <CTGaugeY:-40>
 *
 * メモ欄で指定した値は、
 * プラグインパラメータのX・Yオフセットに加算されます。
 *
 * 例：
 *
 * プラグインパラメータ
 * Xオフセット：0
 * Yオフセット：8
 *
 * メモ欄
 * <CTGaugeX:20>
 * <CTGaugeY:-40>
 *
 * の場合、
 *
 * 最終的な補正値は
 *
 * X：20
 * Y：-32
 *
 * となります。
 *
 * メモ欄にタグを記述しなかったエネミーは、
 * プラグインパラメータの位置設定のみを使用します。
 *
 *
 * ■ゲージについて
 *
 * TPBチャージタイムが
 *
 * 0.0 = ゲージ最小
 * 1.0 = ゲージ最大
 *
 * として表示されます。
 *
 * ゲージはバトラーの実際のTPBチャージタイムをそのまま表示します。
 *
 * このプラグインはTPB戦闘時のみゲージを表示します。
 *
 *
 * ■注意
 *
 * ファイル名は
 *
 * SF_EnemyChargeGauge_Ver1.js
 *
 * から変更しないでください。
 *
 *
 *
 * @param GaugeWidth
 * @text ゲージ幅
 * @type number
 * @min 1
 * @desc エネミーTPBゲージの横幅を指定します。
 * @default 100
 *
 * @param GaugeHeight
 * @text ゲージ高さ
 * @type number
 * @min 1
 * @desc エネミーTPBゲージの高さを指定します。
 * @default 12
 *
 * @param OffsetX
 * @text Xオフセット
 * @type number
 * @min -999
 * @max 999
 * @desc すべてのエネミーに適用する横方向の基準オフセットです。
 * @default 0
 *
 * @param OffsetY
 * @text Yオフセット
 * @type number
 * @min -999
 * @max 999
 * @desc すべてのエネミーに適用する縦方向の基準オフセットです。
 * @default 8
 *
 */

(() => {

    "use strict";

    //=========================================================================
    // プラグイン設定
    //=========================================================================

    const pluginName =
        "SF_EnemyChargeGauge_Ver1";

    const parameters =
        PluginManager.parameters(pluginName);

    const gaugeWidth =
        Number(parameters["GaugeWidth"] || 100);

    const gaugeHeight =
        Number(parameters["GaugeHeight"] || 12);

    const offsetX =
        Number(parameters["OffsetX"] || 0);

    const offsetY =
        Number(parameters["OffsetY"] || 8);



    //=========================================================================
    // Sprite_EnemyTpbChargeGauge
    // エネミー用TPBチャージゲージ
    //=========================================================================

    class Sprite_EnemyTpbChargeGauge extends Sprite {

        initialize(enemySprite) {

            super.initialize();

            this._enemySprite =
                enemySprite;

            this._battler =
                enemySprite._battler;

            const enemyData =
                this._battler.enemy();

            const individualGaugeWidth =
                Number(enemyData.meta.CTGaugeWidth);

            const individualGaugeHeight =
                Number(enemyData.meta.CTGaugeHeight);

            this._gaugeWidth =
                Number.isFinite(individualGaugeWidth)
                && individualGaugeWidth >= 1
                    ? individualGaugeWidth
                    : gaugeWidth;

            this._gaugeHeight =
                Number.isFinite(individualGaugeHeight)
                && individualGaugeHeight >= 1
                    ? individualGaugeHeight
                    : gaugeHeight;

            this.bitmap =
                new Bitmap(
                    this._gaugeWidth,
                    this._gaugeHeight
                );

            this._lastRate =
                -1;

            this.update();
        }


        //=====================================================================
        // update
        //=====================================================================

        update() {

            super.update();

            this.updatePosition();
            this.updateVisibility();
            this.updateGauge();
        }


        //=====================================================================
        // updatePosition
        //=====================================================================

        updatePosition() {

            if (!this._enemySprite || !this._battler) {
                return;
            }

            const enemyData =
                this._battler.enemy();

            const individualOffsetX =
                Number(enemyData.meta.CTGaugeX || 0);

            const individualOffsetY =
                Number(enemyData.meta.CTGaugeY || 0);

            this.x =
                this._enemySprite.x
                - this._gaugeWidth / 2
                + offsetX
                + individualOffsetX;

            this.y =
                this._enemySprite.y
                + offsetY
                + individualOffsetY;
        }


        //=====================================================================
        // updateVisibility
        //=====================================================================

        updateVisibility() {

            this.visible =
                BattleManager.isTpb()
                && !!this._battler
                && this._enemySprite.visible
                && this._battler.isAlive();
        }


        //=====================================================================
        // updateGauge
        //=====================================================================

        updateGauge() {

            if (!this._battler) {
                return;
            }

            const rate =
                Math.max(
                    0,
                    Math.min(
                        1,
                        this._battler.tpbChargeTime()
                    )
                );

            if (rate === this._lastRate) {
                return;
            }

            this._lastRate =
                rate;

            this.redraw(rate);
        }


    //=====================================================================
    // redraw
    //=====================================================================

    redraw(rate) {

        const bitmap =
            this.bitmap;

        bitmap.clear();

        // 背景
        bitmap.fillRect(
            0,
            0,
            this._gaugeWidth,
            this._gaugeHeight,
            ColorManager.gaugeBackColor()
        );

        const innerWidth =
            Math.max(
                0,
                Math.floor(
                    this._gaugeWidth * rate
                )
            );

        if (innerWidth <= 0) {
            return;
        }

        // TPBチャージ部分
        bitmap.gradientFillRect(
            0,
            0,
            innerWidth,
            this._gaugeHeight,
            ColorManager.ctGaugeColor1(),
            ColorManager.ctGaugeColor2()
        );
    }
}


    //=========================================================================
    // Spriteset_Battle
    // エネミーTPBゲージ生成
    //=========================================================================

    const _Spriteset_Battle_createEnemies =
        Spriteset_Battle.prototype.createEnemies;

    Spriteset_Battle.prototype.createEnemies =
        function() {

            _Spriteset_Battle_createEnemies.call(this);

            this.createEnemyTpbChargeGauges();
        };


    //=========================================================================
    // createEnemyTpbChargeGauges
    //=========================================================================

    Spriteset_Battle.prototype.createEnemyTpbChargeGauges =
        function() {

            this._enemyTpbChargeGaugeSprites =
                [];

            for (
                const enemySprite
                of this._enemySprites
            ) {

                const gaugeSprite =
                    new Sprite_EnemyTpbChargeGauge(
                        enemySprite
                    );

                this._enemyTpbChargeGaugeSprites.push(
                    gaugeSprite
                );

                this._battleField.addChild(
                    gaugeSprite
                );
            }
        };

})();