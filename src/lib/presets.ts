import type { ThemeId } from './themes';

export type Preset = { id: string; name: string; theme: ThemeId; time: number; questions: string };

const PRICE = `What is the price of Pampers Swaddlers Sensitive Diapers (164 count)?
= $46.49

What is the price of Huggies Natural Care Sensitive Baby Wipes (288 count)?
= $11.99

What is the price of Boudreaux's Butt Paste Maximum Strength (4 oz)?
= $7.49

What is the price of WaterWipes Sensitive Baby Wipes (60 count)?
= $4.29

What is the price of A+D Baby Diaper Rash Ointment (4 oz)?
= $5.69

What is the price of Johnson's Head-to-Toe Baby Wash & Shampoo?
= $6.99

What is the price of Pipette Baby Shampoo + Wash (11.8 oz)?
= $9.39

What is the price of Aveeno Baby Welcome Little One Essentials Gift Set?
= $19.99

What is the price of Kendamil Classic Infant Formula (28.2 oz)?
= $33.99

What is the price of Similac 360 Total Care Ready-to-Feed Formula (32 fl oz)?
= $6.99

What is the price of The First Years Baby Bottle Warmer and Sterilizer?
= $16.39

What is the price of Dr. Brown's Deluxe Baby Bottle Warmer & Sterilizer?
= $42.99

What is the price of Momcozy MW01 Bottle Warmer?
= $33.99

What is the price of Baby Brezza Perfect Warm Bottle Warmer?
= $59.99

What is the price of Frida Baby 4-in-1 Grow-With-Me Bathtub?
= $49.99

What is the price of Lovevery The Play Gym?
= $150.99

What is the price of Bright Starts Playful Paradise Baby Bouncer?
= $28.49

What is the price of Baby Delight Alpine Deluxe Portable Bouncer?
= $54.99

What is the price of Baby Trend Zoo-ometry Baby Walker?
= $38.49

What is the price of a 5-in-1 Baby Activity Walker with Bouncer and Feeding Tray?
= $79.99

What is the price of Baby Trend EZ-Lift Plus Infant Car Seat?
= $99.99

What is the price of Baby Trend Secure-Lift Infant Car Seat with Base?
= $139.99

What is the price of Baby Trend Morph Single-to-Double Modular Stroller?
= $279.99

What is the price of Baby Trend York Compact Stroller Travel System with Infant Car Seat?
= $279.99

What is the price of Baby Trend Nu-Motion Infinity Baby Swing?
= $199.99

What is the price of Baby Trend Simply Smart Nursery Center Deluxe Playard?
= $149.99

What is the price of Baby Trend Play Zone Compact Fold Playard?
= $89.99

What is the price of a basic baby monitor with a camera and parent screen?
= $79.99

What is the price of a standard baby high chair?
= $99.99

What is the price of a baby diaper bag backpack with changing pad?
= $39.99

What is the price of a standard convertible crib?
= $199.99`;

const SHOWER = `How many bones does a newborn baby have approximately?
- 206
* 300
- 250
- 180

In the Baby Shark song, how many times is "doo" repeated in a single verse
- 12
* 18
- 24
- 6

In traditional Nepali culture, at what age is Pasni (first rice-feeding ceremony) usually performed for a baby boy and a baby girl?
- Boy: 5 months, Girl: 6 months
* Boy: 6 months, Girl: 5 months
- Boy: 7 months, Girl: 6 months
- Boy: 5 months, Girl: 7 months

What is the average number of diapers a newborn can use in one day?
- 3–5
- 5–7
* 8–12
- 15–20

In the rhyme "Johny Johny Yes Papa," what is Johny accused of eating?
- Chocolate
- Candy
* Sugar
- Ice cream

What is a baby's first poop called?
- Colostrum
- Vernix
* Meconium
- Lanugo

What do desi parents traditionally tell children to do before going outside in the sun?
- Wear sunscreen
- Drink cold water
* Wear a cap
- Hide face

Which food is commonly given to babies as one of their first solid foods in South Asian households?
- Spicy achar
- Popcorn
* Mashed rice or khichdi
- Whole almonds

What is the first yellowish milk produced by a mother after childbirth called?
- Formula
- Lactose
* Colostrum
- Calcium

In the nursery rhyme "Five Little Monkeys," what were the monkeys doing on the bed?
- Sleeping
- Eating
* Jumping
- Dancing

What is the soft spot on a baby's head called?
- Crown
- Cranium
* Fontanelle
- Temple

How many teeth do most children have by the age of 3?
- 12
- 16
* 20
- 24

Complete the rhyme: "Twinkle, twinkle, little star, how I wonder..."
- Where you are
* What you are
- Who you are
- Why you are

What percentage of babies are born on their exact due date?
- Around 7%
- Around 10%
* Around 4%
- Around 20%

In the Bollywood movie "Taare Zameen Par," what is the name of the little boy?
- Rahul
* Ishaan
- Rohan
- Arjun

How many hours does a newborn typically sleep in a 24-hour period?
- 6–8 hours
- 10–12 hours
* 14–17 hours
- 20–22 hours

In the rhyme "Baa, Baa, Black Sheep," how many bags of wool does the sheep have?
- One
- Two
* Three
- Four

What is the traditional name for the ceremony when a baby is formally given their name in many South Asian families?
- Pasni
- Mundan
* Namkaran
- Mehendi

At approximately what age do most babies start walking independently?
- 6–8 months
- 9–10 months
* 12–15 months
- 18–20 months

What is a common first word spoken by babies?
* Mama
- Dada
- No
- Bye-bye

What do many desi grandmothers traditionally believe putting a black tika on a baby will protect them from?
- Sunburn
- Mosquitoes
* Evil eye
- Bad dreams

In the rhyme "Humpty Dumpty," what was Humpty Dumpty sitting on?
- A chair
- A rooftop
* A wall
- A tree

Which Disney character famously says "Ohana means family"?
- Nemo
- Simba
* Stitch
- Dumbo

What is the traditional Nepali ceremony called when a baby is formally given their name?
- Pasni
* Nwaran
- Teej
- Bratabandha

Approximately how many diapers will a baby use during their first year?
* 2,500–3,000
- 1,000-1,200
- 1,500-2,000
- 3,500-4,000`;

export const PRESETS: Preset[] = [
  { id: 'preset:price', name: 'Baby Shower: Price Is Right', theme: 'ocean', time: 30, questions: PRICE },
  { id: 'preset:shower', name: 'Baby Shower Trivia', theme: 'pink', time: 20, questions: SHOWER },
];
