export interface TrackList {
	track: Track;
}

export interface Track {
	track_id: number;
	track_mbid: string;
	track_isrc: string;
	commontrack_isrcs: Array<string[]>;
	track_spotify_id: string;
	commontrack_spotify_ids: string[];
	commontrack_7digital_ids: any[];
	commontrack_itunes_ids: number[];
	track_soundcloud_id: number;
	track_xboxmusic_id: string;
	track_name: string;
	track_name_translation_list: any[];
	track_rating: number;
	track_length: number;
	commontrack_id: number;
	instrumental: number;
	explicit: number;
	has_lyrics: number;
	has_lyrics_crowd: number;
	has_subtitles: number;
	has_richsync: number;
	has_track_structure: number;
	num_favourite: number;
	lyrics_id: number;
	subtitle_id: number;
	album_id: number;
	album_name: string;
	album_vanity_id: string;
	artist_id: number;
	artist_mbid: string;
	artist_name: string;
	album_coverart_100x100: string;
	album_coverart_350x350: string;
	album_coverart_500x500: string;
	album_coverart_800x800: string;
	track_share_url: string;
	track_edit_url: string;
	commontrack_vanity_id: string;
	restricted: number;
	first_release_date: Date;
	updated_time: Date;
	primary_genres: AryGenres;
	secondary_genres: AryGenres;
}

export interface AryGenres {
	music_genre_list: MusicGenreList[];
}

export interface MusicGenreList {
	music_genre: MusicGenre;
}

export interface MusicGenre {
	music_genre_id: number;
	music_genre_parent_id: number;
	music_genre_name: string;
	music_genre_name_extended: string;
	music_genre_vanity: string;
}

export interface Subtitle {
	subtitle_id: number;
	restricted: number;
	published_status: number;
	subtitle_body: string;
	subtitle_avg_count: number;
	lyrics_copyright: string;
	subtitle_length: number;
	subtitle_language: string;
	subtitle_language_description: string;
	script_tracking_url: string;
	pixel_tracking_url: string;
	html_tracking_url: string;
	writer_list: any[];
	publisher_list: any[];
	updated_time: Date;
}

export interface Lyrics {
	lyrics_id: number;
	can_edit: number;
	check_validation_overridable: number;
	locked: number;
	published_status: number;
	action_requested: string;
	verified: number;
	restricted: number;
	instrumental: number;
	explicit: number;
	lyrics_body: string;
	lyrics_language: string;
	lyrics_language_description: string;
	script_tracking_url: string;
	pixel_tracking_url: string;
	html_tracking_url: string;
	lyrics_copyright: string;
	writer_list: any[];
	publisher_list: any[];
	backlink_url: string;
	updated_time: Date;
}
