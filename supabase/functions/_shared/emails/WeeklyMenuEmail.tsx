// deno-lint-ignore-file
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Column,
  Row,
  Tailwind,
} from "npm:@react-email/components@0.0.12";
import * as React from "npm:react@18.3.1";

interface Recipe {
  title: string;
  time: string;
  image_url?: string;
}

interface WeeklyMenuEmailProps {
  recipes: Recipe[];
}

export const WeeklyMenuEmail = ({
  recipes = [],
}: WeeklyMenuEmailProps) => {
  const heroRecipe = recipes[0];
  const listRecipes = recipes.slice(1, 5);

  return (
    <Html>
      <Head />
      <Preview>Your Weekly Menu is here! 🍲</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: "#FDFBF7",
                stone: {
                  100: "#f5f5f4",
                },
              },
              fontFamily: {
                serif: ["Georgia", "serif"],
              },
            },
          },
        }}
      >
        <Body className="bg-[#FDFBF7] my-auto mx-auto font-serif px-2 py-10">
          <Container className="border border-solid border-[#f5f5f4] rounded-2xl overflow-hidden bg-white max-w-[600px] mx-auto">
            {/* Header */}
            <Section className="py-8 text-center">
              <Img
                src="https://raw.githubusercontent.com/joshdormont/meal-planner-assets/main/sous-logo.png" // Replace with actual logo URL if available, or use placeholder logic
                width="48"
                height="48"
                alt="Sous Logo"
                className="mx-auto mb-4"
              />
              <Heading className="text-2xl font-normal text-gray-800 m-0">
                Your Weekly Menu
              </Heading>
            </Section>

            {heroRecipe && (
              <Section className="px-6 pb-8">
                <Img
                  src={heroRecipe.image_url || "https://placehold.co/600x400?text=Delicious+Recipe"}
                  alt={heroRecipe.title}
                  className="w-full h-64 object-cover rounded-xl mb-6"
                />
                <Heading className="text-3xl font-normal text-gray-900 mb-2 leading-tight">
                  {heroRecipe.title}
                </Heading>
                
                <div className="flex items-center mb-6 text-gray-600">
                  <Img
                    src="https://react-email-demo-ijnnx5hul-resend.vercel.app/static/vercel-clock.png" // Placeholder clock icon
                    width="16"
                    height="16"
                    alt="Time"
                    className="mr-2 inline-block align-middle"
                    style={{filter: "invert(1) brightness(0.5)"}} // Simple filter to make white icon dark if needed, or use proper asset
                  />
                  <Text className="m-0 text-sm inline-block align-middle font-sans text-gray-500 uppercase tracking-wider">
                     {heroRecipe.time}
                  </Text>
                </div>

                <Button
                  className="bg-black text-white px-8 py-3 rounded-full font-sans font-medium text-sm no-underline text-center block w-full sm:w-auto"
                  href={`https://example.com/recipes/${heroRecipe.title}`} // Placeholder link
                >
                  Cook This
                </Button>
              </Section>
            )}

            {listRecipes.length > 0 && (
              <Section className="px-6 pb-8">
                <Text className="text-sm font-sans font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
                  Also on the menu
                </Text>
                {listRecipes.map((recipe, index) => (
                  <Row key={index} className="mb-6">
                    <Column className="w-24 pr-4">
                      <Img
                        src={recipe.image_url || "https://placehold.co/150x150?text=Recipe"}
                        alt={recipe.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </Column>
                    <Column>
                      <Text className="text-lg text-gray-800 font-serif m-0 mb-1 leading-snug">
                        {recipe.title}
                      </Text>
                      <Text className="text-sm text-gray-500 font-sans m-0">
                        {recipe.time}
                      </Text>
                    </Column>
                  </Row>
                ))}
              </Section>
            )}

            {/* Footer */}
            <Section className="bg-[#f5f5f4] py-6 text-center">
              <Text className="text-gray-500 text-sm m-0 font-sans">
                Cook smarter with Sous
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WeeklyMenuEmail;
