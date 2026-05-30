export interface AIProvider {
  generateItinerary(params: {
    destination: string;
    numberOfDays: number;
    budgetType: string;
    interests: string[];
  }): Promise<any>;

  regenerateDay(params: {
    destination: string;
    budgetType: string;
    interests: string[];
    currentDayData: any;
    userInstruction: string;
  }): Promise<any>;
}
