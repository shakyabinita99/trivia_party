import type { ThemeId } from './themes';

export type Preset = { id: string; name: string; theme: ThemeId; time: number; questions: string };

const PRICE = `What is the price of Pampers Swaddlers Sensitive Diapers (164 count)?
@image /pics/price-01.jpg side
= $46.49

What is the price of Huggies Natural Care Sensitive Baby Wipes (288 count)?
@image /pics/price-02.jpg side
= $11.99

What is the price of Boudreaux's Butt Paste Maximum Strength (4 oz)?
@image /pics/price-03.jpg side
= $7.49

What is the price of WaterWipes Sensitive Baby Wipes (60 count)?
@image /pics/price-04.jpg side
= $4.29

What is the price of A+D Baby Diaper Rash Ointment (4 oz)?
@image /pics/price-05.jpg side
= $5.69

What is the price of Johnson's Head-to-Toe Baby Wash & Shampoo?
@image /pics/price-06.jpg side
= $6.99

What is the price of Pipette Baby Shampoo + Wash (11.8 oz)?
@image /pics/price-07.jpg side
= $9.39

What is the price of Aveeno Baby Welcome Little One Essentials Gift Set?
@image /pics/price-08.jpg side
= $19.99

What is the price of Kendamil Classic Infant Formula (28.2 oz)?
@image /pics/price-09.jpg side
= $33.99

What is the price of Similac 360 Total Care Ready-to-Feed Formula (32 fl oz)?
@image /pics/price-10.jpg side
= $6.99

What is the price of The First Years Baby Bottle Warmer and Sterilizer?
@image /pics/price-11.jpg side
= $16.39

What is the price of Dr. Brown's Deluxe Baby Bottle Warmer & Sterilizer?
@image /pics/price-12.jpg side
= $42.99

What is the price of Momcozy MW01 Bottle Warmer?
@image /pics/price-13.jpg side
= $33.99

What is the price of Baby Brezza Perfect Warm Bottle Warmer?
@image /pics/price-14.jpg side
= $59.99

What is the price of Frida Baby 4-in-1 Grow-With-Me Bathtub?
@image /pics/price-15.jpg side
= $49.99

What is the price of Lovevery The Play Gym?
= $150.99

What is the price of Bright Starts Playful Paradise Baby Bouncer?
@image /pics/price-17.jpg side
= $28.49

What is the price of Baby Delight Alpine Deluxe Portable Bouncer?
@image /pics/price-18.jpg side
= $54.99

What is the price of Baby Trend Zoo-ometry Baby Walker?
@image /pics/price-19.jpg side
= $38.49

What is the price of a 5-in-1 Baby Activity Walker with Bouncer and Feeding Tray?
@image /pics/price-20.jpg side
= $79.99

What is the price of Baby Trend EZ-Lift Plus Infant Car Seat?
@image /pics/price-21.jpg side
= $99.99

What is the price of Baby Trend Secure-Lift Infant Car Seat with Base?
@image /pics/price-22.jpg side
= $139.99

What is the price of Baby Trend Morph Single-to-Double Modular Stroller?
= $279.99

What is the price of Baby Trend York Compact Stroller Travel System with Infant Car Seat?
@image /pics/price-24.jpg side
= $279.99

What is the price of Baby Trend Nu-Motion Infinity Baby Swing?
= $199.99

What is the price of Baby Trend Simply Smart Nursery Center Deluxe Playard?
@image /pics/price-26.jpg side
= $149.99

What is the price of Baby Trend Play Zone Compact Fold Playard?
= $89.99

What is the price of a basic baby monitor with a camera and parent screen?
@image /pics/price-28.jpg side
= $79.99

What is the price of a standard baby high chair?
@image /pics/price-29.jpg side
= $99.99

What is the price of a baby diaper bag backpack with changing pad?
@image /pics/price-30.jpg side
= $39.99

What is the price of a standard convertible crib?
@image /pics/price-31.jpg side
= $199.99`;

const SHOWER = `How many bones does a newborn baby have approximately?
@image /pics/shower-01.jpg side
- 180
- 206
- 250
* 300

In the Baby Shark song, how many times is "doo" repeated in a single verse?
@image /pics/shower-02.jpg side
- 12
* 18
- 24
- 6

In traditional Nepali culture, at what age is Pasni (first rice-feeding ceremony) usually performed for a baby boy and a baby girl?
@image /pics/shower-03.jpg side
- Boy: 5 months, Girl: 6 months
* Boy: 6 months, Girl: 5 months
- Boy: 7 months, Girl: 6 months
- Boy: 5 months, Girl: 7 months

What is the average number of diapers a newborn can use in one day?
@image /pics/shower-04.jpg side
- 3–5
- 5–7
* 8–12
- 15–20

In the rhyme "Johny Johny Yes Papa," what is Johny accused of eating?
@image /pics/shower-05.jpg side
* Sugar
- Chocolate
- Candy
- Ice cream

What is a baby's first poop called?
@image /pics/shower-06.jpg side
- Colostrum
- Vernix
- Lanugo
* Meconium

What do desi parents traditionally tell children to do before going outside in the sun?
- Wear sunscreen
* Wear a cap
- Drink cold water
- Hide face

Which food is commonly given to babies as one of their first solid foods in South Asian households?
* Mashed rice or khichdi
- Spicy achar
- Popcorn
- Whole almonds

What is the first yellowish milk produced by a mother after childbirth called?
- Formula
- Lactose
- Calcium
* Colostrum

In the nursery rhyme "Five Little Monkeys," what were the monkeys doing on the bed?
@image /pics/shower-10.jpg side
- Sleeping
* Jumping
- Eating
- Dancing

What is the soft spot on a baby's head called?
* Fontanelle
- Crown
- Cranium
- Temple

How many teeth do most children have by the age of 3?
@image /pics/shower-12.jpg side
- 12
- 16
* 20
- 24

Complete the rhyme: "Twinkle, twinkle, little star, how I wonder..."
@image /pics/shower-13.jpg side
- Where you are
* What you are
- Who you are
- Why you are

What percentage of babies are born on their exact due date?
@image /pics/shower-14.jpg side
* Around 4%
- Around 7%
- Around 10%
- Around 20%

In the Bollywood movie "Taare Zameen Par," what is the name of the little boy?
@image /pics/shower-15.jpg side
- Rahul
- Rohan
- Arjun
* Ishaan

How many hours does a newborn typically sleep in a 24-hour period?
@image /pics/shower-16.jpg side
- 6–8 hours
- 10–12 hours
* 14–17 hours
- 20–22 hours

In the rhyme "Baa, Baa, Black Sheep," how many bags of wool does the sheep have?
@image /pics/shower-17.jpg side
- One
- Two
* Three
- Four

What is the traditional name for the ceremony when a baby is formally given their name in many South Asian families?
- Pasni
- Mundan
- Mehendi
* Namkaran

At approximately what age do most babies start walking independently?
@image /pics/shower-19.jpg side
- 6–8 months
- 9–10 months
* 12–15 months
- 18–20 months

What is a common first word spoken by babies?
@image /pics/shower-20.jpg side
* Mama
- Dada
- No
- Bye-bye

What do many desi grandmothers traditionally believe putting a black tika on a baby will protect them from?
- Sunburn
* Evil eye
- Mosquitoes
- Bad dreams

In the rhyme "Humpty Dumpty," what was Humpty Dumpty sitting on?
@image /pics/shower-22.jpg side
- A chair
- A rooftop
- A tree
* A wall

Which Disney character famously says "Ohana means family"?
@image /pics/shower-23.jpg side
* Stitch
- Nemo
- Simba
- Dumbo

What is the traditional Nepali ceremony called when a baby is formally given their name?
@image /pics/shower-24.jpg side
- Pasni
* Nwaran
- Teej
- Bratabandha

Approximately how many diapers will a baby use during their first year?
@image /pics/shower-25.jpg side
- 1,000–1,200
- 1,500–2,000
* 2,500–3,000
- 3,500–4,000`;

export const PRESETS: Preset[] = [
  { id: 'preset:price', name: 'Baby Shower: Price Is Right', theme: 'ocean', time: 30, questions: PRICE },
  { id: 'preset:shower', name: 'Baby Shower Trivia', theme: 'pink', time: 20, questions: SHOWER },
];
