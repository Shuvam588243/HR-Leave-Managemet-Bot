const {
    ComponentDialog,
    WaterfallDialog,
    ChoicePrompt,
    ChoiceFactory,
    NumberPrompt,
    TextPrompt,
    Dialog
} = require('botbuilder-dialogs')
const {applyLeaveDialog} = require('../constants');
const {confirmLeave,leaveApplicationForm } = require('../cards/cards');
const { CardFactory } = require('botbuilder-core');



//Constants
const applyLeaveDialogWaterfall1 = 'applyLeaveDialogWaterfall1'
const applyLeaveDialogWaterfall2 = 'applyLeaveDialogWaterfall2'
const ChoicePromptDialog = 'ChoicePromptDialog'
const NumberPromptDialog = 'NumberPromptDialog'
const TextPromptDialog = 'TextPromptDialog'



const applyLeaveDataAccessor = 'applyLeaveDataAccessor'

class ApplyLeave extends ComponentDialog{
    constructor(conversationState){
        super(applyLeaveDialog);

        if(!conversationState) throw new Error('Conversation State is not found');

        this.conversationState = conversationState;
        this.applyLeaveDataAccessor = this.conversationState.createProperty(applyLeaveDataAccessor)

        this.addDialog(new ChoicePrompt(ChoicePromptDialog));
        this.addDialog(new NumberPrompt(NumberPromptDialog));
        this.addDialog(new TextPrompt(TextPromptDialog));

        // this.addDialog(new WaterfallDialog(applyLeaveDialogWaterfall1,[
        //     this.askLeaveType.bind(this),
        //     this.askNoOfDays.bind(this),
        //     this.askDateOfLeave.bind(this),
        //     this.leaveConfirmation.bind(this)
        // ]))

        this.addDialog(new WaterfallDialog(applyLeaveDialogWaterfall2,[
            this.showForm.bind(this),
            this.preprocessUserInput.bind(this),
            // this.applyLeaveApplication.bind(this)         
        ]))



        this.initialDialogId = applyLeaveDialogWaterfall2
    }

    // async askLeaveType(stepContext){
    //     return await stepContext.prompt(ChoicePromptDialog,{
    //         prompt : 'Please help me with the type of leave you want to apply for',
    //         choices : ChoiceFactory.toChoices([
    //             'Sick Leave',
    //             'Casual Leave',
    //             'Earned Leave'
    //         ])
    //     })
    // }

    // async askNoOfDays(stepContext){
    //     let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context,{});
    //     dialogState.leaveType = stepContext.result.value;
    //     return await stepContext.prompt(NumberPromptDialog,`For How many days you want to apply for ${dialogState.leaveType}`);
    // }

    // async askDateOfLeave(stepContext){
    //     let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context);
    //     dialogState.leaveDays = stepContext.result;
    //     return await stepContext.prompt(TextPromptDialog,`From which date you want to apply for you ${dialogState.leaveType} leave application of ${dialogState.leaveDays} days?`);
    // }

    // async leaveConfirmation(stepContext){
    //     let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context);
    //     dialogState.leaveDate = stepContext.result;
    //     await stepContext.context.sendActivity({
    //         attachments : [
    //             CardFactory.adaptiveCard(confirmLeave(
    //                 dialogState.leaveType,
    //                 dialogState.leaveDays,
    //                 dialogState.leaveDate
    //             ))
    //         ]
    //     })
    //     return await stepContext.endDialog();
    // }

    //with form
    async showForm(stepContext){
        try{
           if(stepContext.options && stepContext.options.formRefill){
               return stepContext.next();
           }else{
               await stepContext.context.sendActivity({
                   attachments: [
                       CardFactory.adaptiveCard(leaveApplicationForm())
                   ]
               });
               return Dialog.EndOfTurn;
           }
        }catch(error){
            console.log(error)  
        }
    }
    
    async preprocessUserInput(stepContext){
        try{
            let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context,{});
            let userInput;
            if(stepContext.options && stepContext.options.formRefill){
                userInput = stepContext.options.values;
            }else{
                userInput = stepContext.context.activity.value;
            }
            console.log(userInput)
            dialogState.leaveType = userInput.leaveType;
            dialogState.leaveDays = userInput.leaveDays;
            dialogState.leaveDate = userInput.leaveDate;
            if(parseInt(dialogState.leaveDays) > 3){
                await stepContext.context.sendActivity('You can only apply for 3 days of leave in a row. Please enter the number of details once again')
            }else{
                if(dialogState.leaveType && dialogState.leaveDays && dialogState.leaveDate){
                    await stepContext.context.sendActivity({
                        attachments : [
                            CardFactory.adaptiveCard(confirmLeave(
                                dialogState.leaveType,
                                dialogState.leaveDays,
                                dialogState.leaveDate
                            ))
                        ]
                    })
                }
                else{
                    await stepContext.context.sendActivity('Please Fill All the Fields to proceed');
                }
                return stepContext.next();
            }
        }catch(error){
            console.log(error)
        }
    }
}

module.exports.ApplyLeave = ApplyLeave;