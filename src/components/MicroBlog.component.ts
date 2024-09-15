import { JsonPipe, NgFor, NgIf } from "@angular/common";
import { HttpClient, provideHttpClient } from "@angular/common/http";
import { Component, OnInit, inject } from "@angular/core";
import { lastValueFrom, map } from "rxjs";
import { formatPublishDate } from "../lib/utils.ts";

@Component({
  selector: "app-micro-blog",
  standalone: true,
  imports: [NgFor, NgIf, JsonPipe],
  template: `
    <aside id="microblog" class="mx-2">
      <h2>
        <img
          src="img/microblog.svg"
          width="24px"
          height="24px"
          class="inline"
          alt="Micro.blog Logo"
        />
        Micro Blog
      </h2>

      @if (posts) { @for (post of posts; track post.date_published) {
      <!-- <pre>
        {{ post | json }}
      </pre
      > -->

      <article>
        <time class="slab">
          <a [href]="post.url">{{ formatPublishDate(post.date_published) }}</a>
        </time>
        <div [innerHtml]="post.content_html" class="article"></div>
      </article>
      } }
    </aside>
  `,
})
export default class MicroBlogComponent implements OnInit {
  static clientProviders = [provideHttpClient()];
  static renderProviders = [provideHttpClient()];

  http = inject(HttpClient);
  formatPublishDate = formatPublishDate;

  posts: any;

  ngOnInit() {
    lastValueFrom(
      this.http.get("https://micro.blog/posts/gildotdev").pipe(
        map((response: any) => {
          return response.items;
        })
      )
    ).then((data) => {
      data = data
        .filter((post: any) => {
          return post._microblog.is_conversation === false;
        })
        .slice(0, 5);

      this.posts = data;
    });
  }
}
