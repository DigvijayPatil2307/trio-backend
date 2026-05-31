import { Schema, model, Document, Types } from "mongoose";

export interface ITrip extends Document {
  userId: Types.ObjectId;
  destination: string;
  numberOfDays: number;
  budgetType: "Low" | "Medium" | "High";
  interests: string[];
  startDate: Date;
  companions: string[];
  itinerary: {
    destination: string;
    days: {
      day: number;
      title: string;
      activities: string[];
    }[];
    budget: {
      flights: number;
      accommodation: number;
      food: number;
      activities: number;
      transportation: number;
      total: number;
    };
    hotels: {
      name: string;
      category: string;
      description: string;
    }[];
    travelTips: {
      packing: string[];
      safety: string[];
      localEtiquette: string[];
      weatherAdvice: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    destination: { type: String, required: true },
    numberOfDays: { type: Number, required: true },
    budgetType: { type: String, enum: ["Low", "Medium", "High"], required: true },
    interests: [{ type: String }],
    startDate: { type: Date, default: Date.now },
    companions: [{ type: String, default: [] }],
    itinerary: {
      destination: { type: String },
      days: [
        {
          day: { type: Number },
          title: { type: String },
          activities: [{ type: String }],
        },
      ],
      budget: {
        flights: { type: Number },
        accommodation: { type: Number },
        food: { type: Number },
        activities: { type: Number },
        transportation: { type: Number },
        total: { type: Number },
      },
      hotels: [
        {
          name: { type: String },
          category: { type: String },
          description: { type: String },
        },
      ],
      travelTips: {
        packing: [{ type: String }],
        safety: [{ type: String }],
        localEtiquette: [{ type: String }],
        weatherAdvice: [{ type: String }],
      },
    },
  },
  { timestamps: true }
);

export const Trip = model<ITrip>("Trip", tripSchema);
