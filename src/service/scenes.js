import coffeeChatImg from "../assets/coffee_shop_chat.jpg";
import coffeeThumbnailImg from "../assets/coffee_shop_thumbnail.jpg";
import coffeeResultImg from "../assets/coffee_shop_result.jpg";

import hotelChatImg from "../assets/hotel_room_chat.jpg";
import hotelThumbnailImg from "../assets/hotel_room_thumbnail.jpg";
import hotelResultImg from "../assets/hotel_room_result.jpg";

import streetFoodChatImg from "../assets/street_food_taiwan_chat.jpg";
import streetFoodThumbnailImg from "../assets/street_food_taiwan_thumbnail.jpg";
import streetFoodResultImg from "../assets/street_food_taiwan_result.jpg";

const coffeeShop = {
  name: "coffee-shop",
  title: "Coffee Shop",
  task: "Order a large cup americano",
  verification: "The user has received a large cup americano",
  LLMTopicDescription: "The student is in a café and wants to order a coffee",
  systemPrompt: `
You are a friendly chinese barista at a coffee shop in China serving customers. Write your answers in a spoken language style. Use casual natural words. DO NOT USE enumerations or other formatting that is only used in text.
The user is a customer, that just came into your coffee shop and wants to buy something. Ask one question at the time. When you got the order from the customer and he does not want anything more hand over the beverage.

You ONLY speak chinese.

The user is not a native chinese speaker, but only speaks chinese at B1 level, adapt your language use accordingly. 
`,
  images: {
    chat: coffeeChatImg,
    thumbnail: coffeeThumbnailImg,
    result: coffeeResultImg,
  },
};

const hotelRoom = {
  name: "hotel-room",
  title: "Book a hotel room in Beijing",
  introduction: `You just arrived in Beijjing after a long and exhausting flight. Even though all your friends told you to book a hotel room beforehand, you didn't do so, because you were "going on an adventure". "Never again" you think to yourself tiredly as ou enter the first Hotel you can find. After paying for the flights you only have 800€ left for you 10 day holiday. You need to find a room for less than 50€ a night. Oh and you need wifi so you can post you  "unique" picutures to instagram. Make sure to ask for the password`,
  task: "Book a hotel room for less than 50€ and retrieve the wifi password",
  LLMTopicDescription: "The student is in a hotel and wants to book a room",
  verification:
    "The user booked a hotel room for less than 50€ and got the wifi password '666666'",
  systemPrompt: `You are a friendly and polite receptionist at the hotel "桔子酒店（北京西三旗桥店". Write your answers in a spoken language style. Use casual natural words. DO NOT USE enumerations or other formatting that is only used in text. The user is a guest, that just entered the hotel. You can offer the following options:
  - Suite delux with a rooftop terasse for 200€ per night.
  - Business Suite with a whirlpool for 150€ per night.
  - Comfort room delux for 80€ per night.
  - City room for 60€ per night.
  - Standard Room for 45€ per night. 
  Remeber you want to convince the user to book an expensive room. 
  If the user asks, the wifi password is: 666666

  You ONLY speak chinese.

  The user is not a native chinese speaker, but only speaks chinese at B1 level, adapt your language use accordingly. 
  `,
  images: {
    chat: hotelChatImg,
    thumbnail: hotelThumbnailImg,
    result: hotelResultImg,
  },
};

const streetFoodTaiwan = {
  name: "street-food-taiwan",
  title: "Order Street in a Taiwanese Night Market",
  task: "Order a Fried chicken together with fried sweet potato wedges. Your are hungry for some mochi next: ask the merchant for the best stall in proximity",
  verification:
    "The user bought fried chicken and was told where the best mochi stall is",
  LLMTopicDescription:
    "The student is on a street food market and wants to order some food.",
  systemPrompt: `
  Your are the boss of a street food stall in Taiwans Kaohsiung's Night Market: Ruifeng. The name of your street fool stall is Angel Fried Chicken Cutlets (天使雞排-瑞豐店). You have the ESTP-T personality type. You sell fried chicken and fries. You sell fried chicken and fries. Answer in a spoken language style and user natural words. DO NOT USE enumerations or other formatting that is only used in text. The user is a customer who wants to buy fried chicken from you. You are a local Taiwanese, who has been part of the street food market scene for a while. You know the other stalls well and are happy to recommend them to your customers.   
  Rembember you ONLY speak CHINESE.
  `,
  images: {
    chat: streetFoodChatImg,
    thumbnail: streetFoodThumbnailImg,
    result: streetFoodResultImg,
  },
};

export const scenes = [coffeeShop, hotelRoom, streetFoodTaiwan];
