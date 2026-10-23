import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "cn"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"

interface BlogPostAuthor {
  name: string
  image?: Image
}
interface Image {
  src: string
  alt: string
}

interface Blogpost2Props {
  title: string
  date?: string
  dateTime?: string
  image?: Image
  body?: React.ReactNode
  author?: BlogPostAuthor
  backLink?: {
    text: string
    url: string
  }
  className?: string
}

const Blogpost2 = ({
  className,
  title,
  author,
  image,
  date,
  dateTime,
  backLink = { text: "All posts", url: "/blog" },
  body,
}: Blogpost2Props) => {
  return (
    <section className={cn("py-16 lg:py-32", className)}>
      <div className="container">
        <div className="relative flex flex-col justify-between gap-10 lg:flex-row">
          <aside className="top-24 h-fit flex-shrink-0 lg:sticky lg:w-[300px] xl:w-[400px]">
            <Link
              className="mb-5 flex items-center gap-1 text-muted-foreground hover:text-primary"
              href={backLink.url}
            >
              <ChevronLeft className="h-full w-4" />
              {backLink.text}
            </Link>
            <h1 className="mb-5 text-3xl font-bold text-balance lg:text-4xl">
              {title}
            </h1>
            <div className="flex gap-3">
              {author && (
                <Avatar className="size-7 rounded-full">
                  <AvatarImage
                    src={author.image?.src}
                    alt={author.image?.alt}
                  />
                  <AvatarFallback>{author.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div>
                {author && <p className="font-semibold">{author.name}</p>}
                <time
                  dateTime={dateTime}
                  className="text-xs text-muted-foreground"
                >
                  {date}
                </time>
              </div>
            </div>
          </aside>

          <article className="min-w-0 flex-1">
            {image && (
              <img
                src={image.src}
                alt={image.alt}
                className="mt-0 mb-8 aspect-video w-full rounded-lg object-cover"
              />
            )}
            <div className="prose max-w-none dark:prose-invert">{body}</div>
          </article>
        </div>
      </div>
    </section>
  )
}

export { Blogpost2 }
