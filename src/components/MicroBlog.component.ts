import { JsonPipe, NgFor, NgIf } from "@angular/common";
import { HttpClient, provideHttpClient, withFetch } from "@angular/common/http";
import { Component, inject, type OnInit } from "@angular/core";
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

      @if (posts) { @for (post of posts; track post.properties.uid) {
      <!-- <pre>
        {{ post | json }}
          {{ post.properties.content}}
      </pre> -->

      <article>
        <time class="slab">
          <a [href]="'blog/' + post.properties.uid">{{
            formatPublishDate(post.properties.published)
          }}</a>
        </time>
        <!-- <div set:html="{post.properties.content.compiledContent()}"></div> -->

        <!-- <analog-markdown [content]="post.properties.content"></analog-markdown> -->

        <div [innerHtml]="post.properties.content" class="article"></div>
      </article>
      } }
    </aside>
  `,
})
export default class MicroBlogComponent implements OnInit {
  static clientProviders = [provideHttpClient()];
  static renderProviders = [provideHttpClient(withFetch())];
  private readonly apiKey = import.meta.env['VITE_MICROBLOG_TOKEN'];

  http = inject(HttpClient);
  formatPublishDate = formatPublishDate;

  posts: any;

  ngOnInit() {
    lastValueFrom(
      this.http
        .get("https://micro.blog/micropub?q=source&offset=0&limit=15", {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        })
        .pipe(
          map((response: any) => {
            return response.items;
          })
        )
    ).then((data) => {
      data = data
        // .filter((post: any) => {
        //   return post._microblog.is_conversation === false;
        // })
        .slice(0, 5);
        console.log(data);

      this.posts = data;
    });
  }
}
