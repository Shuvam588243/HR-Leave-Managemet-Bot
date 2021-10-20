const {
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder');

const {helpDialog} = require('../constants');
const helpWaterfall1 = 'helpWaterfall1'

class HelpDialog extends ComponentDialog{
    constructor(conversationState){
        super(helpDialog)

        if(!conversationState) throw new Error('Conversation State is not defined');
        this.conversationState = conversationState;

        this.addDialog(new WaterfallDialog(helpWaterfall1,[
            this.sendSuggestedActions.bind(this)
        ])  
        )

        this.initialDialogId = helpWaterfall1;
    }

    async sendSuggestedActions(stepContext){
        console.log('Here');
        await stepContext.context.sendActivity("I can help you with your leave application request. Please click of 'Apply Leave' button below or write 'apply leave'");
        await stepContext.context.sendActivity(
        {
            attachments : [CardFactory.heroCard(
                'Here are some suggestions that you can try',
                null,
                CardFactory.actions([
                    {
                        type : 'imBack',
                        title : 'Apply Leave',
                        value : 'Apply Leave'
                    },
                    {
                        type : 'imBack',
                        title : 'Leave Status',
                        value : 'Leave Status'
                    },
                    {
                        type : 'imBack',
                        title : 'Help',
                        value : 'Help'
                    }
                ])
            )]
        }
    )
        return await stepContext.endDialog();
}
}

module.exports.HelpDialog = HelpDialog;