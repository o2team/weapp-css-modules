
import styles from './index.module.wxss';

Component({
    data: {
        styles: styles,
        current: 0,
        list: [
            {
                "img": "https://img20.360buyimg.com/ling/jfs/t1/134524/9/15501/294288/5fa9f86aEadd02f8a/906f144f4748d16c.jpg",
            },
            {

                "img": "https://img30.360buyimg.com/ling/jfs/t1/152681/11/5340/265556/5fa9f877E5e0267a6/b0a75f36bf3a1c62.jpg",

            },
            {
                "img": "https://img13.360buyimg.com/ling/jfs/t1/125393/34/17977/253427/5fa9f870E55e045ce/8150d19f05e323c9.jpg",
            },
            {
                "img": "https://img20.360buyimg.com/ling/jfs/t1/134524/9/15501/294288/5fa9f86aEadd02f8a/906f144f4748d16c.jpg",
            },
            {
                "img": "https://img13.360buyimg.com/ling/jfs/t1/139062/9/13989/165189/5fa9f9b6Ede33f131/15128211fee1f794.jpg",
            }]
    },
    methods: {
        onSwiperChange(e) {
            const { current } = e.detail;
            this.setData({ current })
        }
    }

})