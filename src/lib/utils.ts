import { JSDOM } from "jsdom";

const dateOptions: object = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

export function formatPublishDate(publishDate: string | number | Date): string {
  return new Date(publishDate).toLocaleDateString("en-US", dateOptions);
}

export async function truncateHTML(html: string | Promise<string>, uid: string): Promise<string> {
  // Convert the HTML string to a string if it's a promise
  html = typeof html === "string" ? html : await html;

  // Parse the HTML string into a DOM structure
  const doc = new JSDOM(html).window.document;

  // Select all media elements (images and videos)
  const allMedia = doc.querySelectorAll("img, video");

  // Check if there is more than one media element
  if (allMedia.length > 1) {
    const parentNode = allMedia[0].parentNode;

    // Remove all media after the first one
    for (let i = 1; i < allMedia.length; i++) {
      allMedia[i].remove();
    }

    // Create the "More..." link
    const moreLink = doc.createElement("a");
    moreLink.href = `/posts/${uid}`; // Set your URL here
    moreLink.textContent = "More...";
    moreLink.style.display = "block";
    moreLink.style.marginTop = "20px";

    // Insert the link after the first media
    parentNode && parentNode.insertBefore(moreLink, allMedia[0].nextSibling);
  }

  // Serialize the updated DOM back into a string
  html = doc.body.innerHTML;

  return html;
}

// export function timeAgo(time: string | number | Date) {
//     switch (typeof time) {
//         case "number":
//             break;
//         case "string":
//             time = +new Date(time);
//             break;
//         case "object":
//             if (time.constructor === Date) time = time.getTime();
//             break;
//         default:
//             time = +new Date();
//     }
//     var time_formats = [
//         [60, "seconds", 1], // 60
//         [120, "1 minute ago", "1 minute from now"], // 60*2
//         [3600, "minutes", 60], // 60*60, 60
//         [7200, "1 hour ago", "1 hour from now"], // 60*60*2
//         [86400, "hours", 3600], // 60*60*24, 60*60
//         [172800, "Yesterday", "Tomorrow"], // 60*60*24*2
//         [604800, "days", 86400], // 60*60*24*7, 60*60*24
//         [1209600, "Last week", "Next week"], // 60*60*24*7*4*2
//         [2419200, "weeks", 604800], // 60*60*24*7*4, 60*60*24*7
//         [4838400, "Last month", "Next month"], // 60*60*24*7*4*2
//         [29030400, "months", 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
//         [58060800, "Last year", "Next year"], // 60*60*24*7*4*12*2
//         [2903040000, "years", 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
//         [5806080000, "Last century", "Next century"], // 60*60*24*7*4*12*100*2
//         [58060800000, "centuries", 2903040000], // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
//     ];
//     var seconds = (+new Date() - time) / 1000,
//         token = "ago",
//         list_choice = 1;

//     if (seconds == 0) {
//         return "Just now";
//     }
//     if (seconds < 0) {
//         seconds = Math.abs(seconds);
//         token = "from now";
//         list_choice = 2;
//     }
//     var i = 0,
//         format;
//     while ((format = time_formats[i++]))
//         if (seconds < format[0]) {
//             if (typeof format[2] == "string") return format[list_choice];
//             else
//                 return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
//         }
//     return time;
// }
