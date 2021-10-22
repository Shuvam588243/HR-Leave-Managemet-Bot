const restify = require("restify");

const {
  BotFrameworkAdapter,
  MemoryStorage,
  ConversationState,
} = require("botbuilder");
const { MyBot } = require("./botActivityHandler");
const { RootDialog } = require("./dialogs/rootDialog");

const adapter = new BotFrameworkAdapter({
  appId: "",
  appPassword: "",
});

adapter.onTurnError = async (context, error) => {
  if (error) {
    console.log(`Error Occured : ${error}`);
  }

  await context.sendActivity("An Error has occured in the Bot Framework");
  await context.sendActivity("PLease Fix the source code to continue");
};

const server = restify.createServer();
server.listen(3978, () => {
  console.log(`${server.name} listening to ${server.url}`);
});

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const rootDialog = new RootDialog(conversationState);
const handler = new MyBot(conversationState, rootDialog);

server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    await handler.run(context);
  });
});
