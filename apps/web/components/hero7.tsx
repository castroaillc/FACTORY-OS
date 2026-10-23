import { Star } from "lucide-react"
import { cn } from "cn"

import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"

interface Reviews {
  count: number
  rating: number
  avatars: Avatar[]
}
interface Button {
  text: string
  url: string
  icon?: React.ReactNode
}
interface Buttons {
  primary?: Button
  secondary?: Button
}
interface Avatar {
  src: string
  alt: string
}

interface HeroSocialProofProps {
  heading: string
  description: string
  buttons?: Buttons
  reviews?: Reviews
  className?: string
}

interface Hero7Props extends HeroSocialProofProps {}
type Props = Partial<Hero7Props>

const person1 = {
  name: "Jack Walsh",
  firstName: "Jack",
  lastName: "Walsh",
  initials: "JW",
  email: "jack.walsh@example.com",
  username: "jackwalsh",
  role: "Product Designer",
  company: "Cartwright",
  location: "Brisbane, Australia",
  avatar:
    "https://cdn.shadcnblocks.com/shadcnblocks/image-set/modern/avatars/avatar1.webp",
}
const person2 = {
  name: "Ilze Pērkone",
  firstName: "Ilze",
  lastName: "Pērkone",
  initials: "MK",
  email: "iperkone@example.com",
  username: "iperkone",
  role: "Brand Director",
  company: "Kivit",
  location: "Rīga, Latvia",
  avatar:
    "https://cdn.shadcnblocks.com/shadcnblocks/image-set/modern/avatars/avatar2.webp",
}
const person3 = {
  name: "Vernon Desilets",
  firstName: "Vernon",
  lastName: "Desilets",
  initials: "VD",
  email: "vernod@example.com",
  username: "vernod",
  role: "Creative Director",
  company: "Soho Logix",
  location: "Paris, France",
  avatar:
    "https://cdn.shadcnblocks.com/shadcnblocks/image-set/modern/avatars/avatar3.webp",
}
const person4 = {
  name: "Lín Wàngshū",
  firstName: "Lín",
  lastName: "Wangshu",
  initials: "LW",
  email: "linwang4@example.com",
  username: "liwang",
  role: "Graphic Designer",
  company: "Tenxcloud",
  location: "Shanghai, China",
  avatar:
    "https://cdn.shadcnblocks.com/shadcnblocks/image-set/modern/avatars/avatar4.webp",
}
const person5 = {
  name: "Rajesh Bhatt",
  firstName: "Rajesh",
  lastName: "Bhatt",
  initials: "RB",
  email: "rajesh.bhatt@example.com",
  username: "rajeshbhatt",
  role: "UX Researcher",
  company: "Mindtree",
  location: "Mumbai, India",
  avatar:
    "https://cdn.shadcnblocks.com/shadcnblocks/image-set/modern/avatars/avatar5.webp",
}
const defaultProps: Hero7Props = {
  heading: "Introducing the world's best marketing software.",
  description:
    "Loved by marketers around the world—plan campaigns, track results, and grow faster with the tools teams actually rely on.",
  buttons: {
    primary: { text: "Get Started", url: "#" },
    secondary: { text: "View Reviews", url: "#" },
  },
  reviews: {
    count: 206,
    rating: 4.9,
    avatars: [
      { src: person1.avatar, alt: person1.name },
      { src: person2.avatar, alt: person2.name },
      { src: person3.avatar, alt: person3.name },
      { src: person4.avatar, alt: person4.name },
      { src: person5.avatar, alt: person5.name },
    ],
  },
}

const Hero7 = (props: Props) => {
  const { heading, description, buttons, reviews, className } = {
    ...defaultProps,
    ...props,
  }

  return (
    <section className={cn("py-32", className)}>
      <div className="container text-center">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <h1 className="mx-auto max-w-3xl text-3xl font-semibold lg:text-6xl">
            {heading}
          </h1>
          <p className="mx-auto max-w-4xl text-balance text-muted-foreground lg:text-lg">
            {description}
          </p>
        </div>
        {buttons?.primary && (
          <Button
            size="lg"
            className="mt-10 h-12 px-8 text-base"
            render={<a href={buttons.primary.url} />}
            nativeButton={false}
          >
            {buttons.primary.text}
          </Button>
        )}
        <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-3 sm:flex-row sm:gap-2">
          <span className="inline-flex items-center -space-x-3">
            {(reviews?.avatars ?? []).map((avatar, index) => (
              <Avatar key={index} className="size-12 border">
                <AvatarImage src={avatar.src} alt={avatar.alt} />
              </Avatar>
            ))}
          </span>
          <div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className="size-5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="mr-1 font-semibold">
                {reviews?.rating?.toFixed(1)}
              </span>
            </div>
            <p className="text-left font-medium text-muted-foreground">
              from {reviews?.count}+ reviews
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero7 }
