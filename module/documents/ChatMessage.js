export default class UndertakingChatMessage extends ChatMessage {

    async getHTML(...args) {
        const html = await super.getHTML();
        this._highlightCriticalSuccessFailure(html);
        this._addListeners(html);
        return html;
    }

    _highlightCriticalSuccessFailure(html) {
        if ( !this.isContentVisible || !this.rolls.length ) return;
        const originatingMessage = game.messages.get(this.getFlag("undertaking", "originatingMessage"));
        const displayChallenge = originatingMessage?.shouldDisplayChallenge;
    
        // Highlight rolls where the first part is a d20 roll
        for ( let [index, d20Roll] of this.rolls.entries() ) {
    
            const d0 = d20Roll.dice[0];
            if ( (d0?.faces !== 20) || (d0?.values.length !== 1) ) continue;
        
            d20Roll = CONFIG.Dice.D20Roll.fromRoll(d20Roll);
            const d = d20Roll.dice[0];
        
            // Highlight successes and failures
            const total = html.find(".dice-total")[index];
            if ( !total ) continue;
            if ( d20Roll.isCritical ) total.classList.add("critical");
            else if ( d20Roll.isFumble ) total.classList.add("fumble");
        }
    }

    _addListeners(html){
        html.find(".undertaking-roll-damage").on("click", event => {
            CONFIG.Item.documentClass.chatRollDamage(event, this.speaker.actor);
        });
    }
}