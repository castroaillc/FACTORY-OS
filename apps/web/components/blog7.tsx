import Link from "next/link"
import { cn } from "cn"
import { ArrowRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/card"

interface BlogCardGridPost {
  id?: string | number
  title: string
  summary?: string
  href: string
  image?: Image
  category?: string
  date?: string
  dateTime?: string
  author?: string
  cta?: string
}
interface Image {
  src: string
  alt: string
}

interface Blog7Props {
  heading: string
  description?: string
  posts: BlogCardGridPost[]
  emptyText?: string
  className?: string
}

const Blog7 = ({
  heading,
  description,
  posts,
  emptyText = "No posts yet. Check back soon.",
  className,
}: Blog7Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-12">
          <header className="flex flex-col items-center gap-4 text-center">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {heading}
            </h1>
            {description && (
              <p className="max-w-2xl text-lg font-medium text-pretty text-muted-foreground md:text-xl">
                {description}
              </p>
            )}
          </header>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">{emptyText}</p>
          ) : (
            <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card
                  key={post.id ?? post.title}
                  className="grid grid-rows-[auto_auto_1fr_auto] overflow-hidden pt-0"
                >
                  <Link
                    href={post.href}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="block aspect-video w-full overflow-hidden bg-muted"
                  >
                    {post.image && (
                      <img
                        src={post.image.src}
                        alt={post.image.alt}
                        className="h-full w-full object-cover object-center transition-opacity duration-300 hover:opacity-90"
                      />
                    )}
                  </Link>
                  <CardHeader className="gap-3">
                    {post.category && (
                      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {post.category}
                      </span>
                    )}
                    <h2 className="text-lg leading-snug font-semibold text-balance">
                      <Link
                        href={post.href}
                        className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      {post.author && (
                        <>
                          <span className="font-medium text-foreground">
                            {post.author}
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground/40"
                          >
                            ·
                          </span>
                        </>
                      )}
                      <time
                        dateTime={post.dateTime}
                        className="text-muted-foreground tabular-nums"
                      >
                        {post.date}
                      </time>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                      {post.summary}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={post.href}
                      className="group/cue inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {post.cta ?? "Read more"}
                      <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover/cue:text-foreground" />
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export { Blog7 }
