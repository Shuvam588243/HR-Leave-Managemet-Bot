const {ActivityHandler,CardFactory} = require('botbuilder');


class MyBot extends ActivityHandler{
    constructor(conversationState,rootDialog){
        super();

        if(!conversationState) throw new Error('Conversation State is not defined');
        if(!rootDialog) throw new Error('Root Dialog is not Found');

        this.conversationState = conversationState;
        this.rootDialog = rootDialog;
        this.accessor = this.conversationState.createProperty('DialogAccessor');

        this.onMembersAdded(async(context,next)=>{
            const membersAdded = context.activity.membersAdded;
            for(let cnt = 0; cnt < membersAdded.length; cnt ++){
                if(membersAdded[cnt].id !== context.activity.recipient.id){
                    
                    await this.sendIntroCard(context);
                    // await this.sendServicesOptions(context);
                }
            }
        });

        this.onMessage(async(context,next)=>{
            await this.rootDialog.run(context, this.accessor);
            await next();
        })
    }

    async run(context){
        await super.run(context);
        await this.conversationState.saveChanges(context,false);
    }

    async sendServicesOptions(context){
        await context.sendActivity(
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
    }

    async sendIntroCard(context){
        await context.sendActivity(
            {
                attachments: [CardFactory.adaptiveCard(
                    {
                        "type": "AdaptiveCard",
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "version": "1.3",
                        "body": [
                            {
                                "type": "Container",
                                "items": [
                                    {
                                        "type": "Image",
                                        "url": "https://c.tenor.com/hE0T8D0GpXsAAAAC/joinblink-blink.gif"
                                    },
                                    {
                                        "type": "TextBlock",
                                        "text": "Welcome, User! I am your personal assistant. I can help you with your leave application request. Type help to know all my features. How can I help you ?",
                                        "wrap": true,
                                        "size": "Medium",
                                        "weight": "Bolder",
                                        "color": "Accent",
                                        "spacing": "Medium"
                                    }
                                ]
                            }
                        ]
                    }
                )]
            }
        );
    }
}

module.exports.MyBot = MyBot;