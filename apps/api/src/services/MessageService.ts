export class MessageService {
  public createGreeting(name: string): string {
    if (!name || name.trim() === "") {
      throw new Error("Name is required");
    }
    
    return `hello ${name.trim()}`;
  }

  public createCustomMessage(message: string, name?: string): string {
    if (name) {
      return `${message}, ${name}!`;
    }
    return message;
  }
}

export default MessageService;
