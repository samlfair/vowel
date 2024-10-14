const img = /^https?:\/\/\S+(avif|gif|heif|jpeg|jpg|png|tiff|webp)(\?\S+)?/;
const pdf = /^https?:\/\/\S+(pdf)(\?\S+)?/;
const url = /^https?:\/\/\S+$/;
const path = /^\/[\/\S]+$/;
// const humanDate = /^((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)[\d\040,\/(nd|rd|st|th)]{8,12}|[\d\040,\/(nd|rd|st|th)]{1,5}(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December),?\040\d{2,4})$/;

export default {
	url,
	img,
	path,
	pdf
};
